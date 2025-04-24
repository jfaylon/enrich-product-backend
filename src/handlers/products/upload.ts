import { APIGatewayProxyHandler } from "aws-lambda";
import busboy from "busboy";
import { pipeline, Readable, Transform } from "stream"; // To create a readable stream from a buffer
import csv from "csv-parser";
import exceljs from "exceljs";
import Product from "../../models/Product";
import { retrieveUserId } from "../../services/UserService";
import { consumeStream } from "../../utils";
import { UploadedFile } from "../../interfaces";
import { promisify } from "util";
import "../../utils/bootstrap";

const parseCSV = (csvStream: Readable, userId: string) => {
  return new Promise((resolve, reject) => {
    const counter = { count: 0 };
    pipeline(
      csvStream,
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

const parseXLSX = async (xlsxStream: Readable, userId: string) => {
  const counter = { count: 0 };
  const rowStream = new Readable({ objectMode: true, read() {} });

  const workbookReader = new exceljs.stream.xlsx.WorkbookReader(xlsxStream, {});

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
  const pipelineAsync = promisify(pipeline);

  await pipelineAsync(rowStream, processRow(userId, counter), consumeStream);
  return { counter: counter.count };
};

const processRow = (userId: string, counter: { count: number }) => {
  return new Transform({
    objectMode: true,
    async transform(data, encoding, callback) {
      console.log(data);
      const product = new Product({
        name: data["Product Name"],
        brand: data["Brand"],
        images: data["Images"]?.split(",") || [],
        barcode: data["Barcode"],
        userId,
      });
      console.log(product);
      await product.save();
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
    let hasUploadedFile = false;
    form.on("file", async (fieldname: string, file: Readable, fileInfo) => {
      try {
        const mimeType = fileInfo.mimeType;
        const filename = fileInfo.filename;

        if (mimeType === "text/csv") {
          const processedCount = await parseCSV(file, userId);
          hasUploadedFile = true;
          resolve(processedCount);
        } else if (
          mimeType ===
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          filename.endsWith(".xlsx")
        ) {
          const processedCount = await parseXLSX(file, userId);
          hasUploadedFile = true;
          resolve(processedCount);
        } else {
          reject(new Error("Invalid file uploaded"));
        }
      } catch (err) {
        reject(err);
      }
    });

    form.on("end", () => {
      if (!hasUploadedFile) {
        reject(new Error("No file uploaded"));
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
    const countData = await fileParsePromise;
    // Return parsed CSV data as response
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "File uploaded and processed successfully",
        data: countData,
      }),
    };
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to process file",
        detail: (err as Error).message,
      }),
    };
  }
};
