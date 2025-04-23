import { APIGatewayProxyHandler } from "aws-lambda";
import busboy from "busboy";
import { pipeline, Readable, Transform } from "stream"; // To create a readable stream from a buffer
import csv from "csv-parser";
import exceljs from "exceljs";
import Product from "../../models/Product";
import { retrieveUserId } from "../../services/UserService";
import { consumeStream } from "../../utils";
import { UploadedFile } from "../../interfaces";

const parseCSV = (csvBuffer: Buffer, userId: string) => {
  return new Promise((resolve, reject) => {
    const counter = { count: 0 };
    const readableStream = Readable.from(csvBuffer); // Convert buffer to readable stream
    pipeline(
      readableStream,
      csv(), // Parse the CSV file
      processRow(userId, counter), // Process each row
      consumeStream, // Final writable stream to consume the data
      (err) => {
        if (err) {
          reject(err); // If any stream in the pipeline fails, reject the promise
        } else {
          resolve({ counter: counter.count }); // Resolve when everything is done
        }
      }
    );
  });
};

const parseXLSX = async (xlsxBuffer: Buffer, userId: string) => {
  const counter = { count: 0 };
  const rowStream = new Readable({ objectMode: true, read() {} });

  const inputStream = Readable.from(xlsxBuffer);
  const workbookReader = new exceljs.stream.xlsx.WorkbookReader(
    inputStream,
    {}
  );

  for await (const worksheet of workbookReader) {
    let headers: Record<number, string> = {};
    for await (const row of worksheet) {
      if (row.number === 1) {
        row.eachCell((cell, col) => (headers[col] = cell.text.trim()));
        continue;
      }

      const data: Record<string, string> = {};
      row.eachCell((cell, col) => (data[headers[col]] = cell.text.trim()));
      rowStream.push(data);
    }
  }

  rowStream.push(null);

  await pipeline(rowStream, processRow(userId, counter), consumeStream);
  return { counter: counter.count };
};

const processRow = (userId: string, counter: { count: number }) => {
  return new Transform({
    objectMode: true,
    async transform(data, encoding, callback) {
      const product = new Product({
        name: data["Product Name"],
        brand: data["Brand"],
        images: data["Images"]?.split(",") || [],
        barcode: data["Barcode"],
        userId,
      });
      // await product.save();
      console.log(product);
      counter.count++;
      return callback(null, product);
    },
  });
};

export const handler: APIGatewayProxyHandler = async (event) => {
  // console.log(event);

  // Check if the body is Base64 encoded
  const userId = retrieveUserId(event);
  const body = event.isBase64Encoded
    ? Buffer.from(event.body as string, "base64")
    : event.body;

  // console.log("Decoded Body:", body);

  // console.log("Received Headers:", event.headers);
  // workaround
  event.headers["content-type"] =
    event.headers["content-type"] || event.headers["Content-Type"];

  const form = busboy({ headers: event.headers });
  const files: UploadedFile[] = []; // To hold the files

  const fileParsePromise = new Promise((resolve, reject) => {
    form.on("file", (fieldname: string, file: Readable, fileInfo) => {
      const chunks: Buffer[] = [];
      file.on("data", (chunk: Buffer) => chunks.push(chunk));
      file.on("end", () => {
        // Once the file is completely uploaded, process it
        const fileBuffer = Buffer.concat(chunks);
        files.push({
          fieldname,
          filename: fileInfo.filename,
          fileBuffer,
          mimeType: fileInfo.mimeType,
        });
      });
    });

    form.on("finish", async () => {
      // Parse the CSV once the file is uploaded
      try {
        if (files.length > 0) {
          const mimeType = files[0].mimeType;
          const filename = files[0].fieldname;
          if (mimeType === "text/csv") {
            const processedCount = await parseCSV(files[0].fileBuffer, userId);
            resolve(processedCount);
          } else if (
            mimeType ===
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
            filename.endsWith(".xlsx")
          ) {
            const processedCount = await parseXLSX(files[0].fileBuffer, userId);
            resolve(processedCount);
          } else {
            reject(new Error("Invalid file uploaded"));
          }
        } else {
          reject(new Error("No file uploaded"));
        }
      } catch (err) {
        reject(err);
      }
    });

    form.on("error", (err) => reject(err));
  });

  // Process the incoming request body using busboy
  const bufferStream = new Readable();
  bufferStream.push(body);
  bufferStream.push(null); // End the stream

  bufferStream.pipe(form); // Pipe the raw body to busboy

  try {
    const csvData = await fileParsePromise;
    // Return parsed CSV data as response
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "File uploaded and CSV processed successfully",
        data: csvData,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to process file",
        detail: (err as Error).message,
      }),
    };
  }
};
