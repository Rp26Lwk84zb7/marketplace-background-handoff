import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const imagePath = process.argv[2];
if (!imagePath) throw new Error("Run: npm run demo -- ./product.jpg");

const imageBase64 = (await readFile(imagePath)).toString("base64");
const response = await fetch("http://localhost:3000/listing-cutouts", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    listingId: "listing-1042",
    orderId: "order-781",
    filename: basename(imagePath),
    imageBase64,
  }),
});

const result: unknown = await response.json();
console.log(JSON.stringify(result, null, 2));
if (!response.ok) process.exitCode = 1;
