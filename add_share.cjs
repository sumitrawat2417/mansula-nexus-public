
const fs = require("fs");
const path = require("path");

const files = [
  "src/BusinessProfile.jsx",
  "src/OrderRecords.jsx",
  "src/Inventory.jsx",
  "src/Customers.jsx",
  "src/BackupRestore.jsx"
];

for (let file of files) {
  let content = fs.readFileSync(file, "utf8");
  
  // 1. Add shareFile import
  if (!content.includes("shareFile")) {
    content = content.replace(/(import\s+\{[^}]*?)(\}\s+from\s+.[\/\\]db\.js.)/, "$1, shareFile $2");
  }

  // 2. Add Share icon
  if (content.includes("const Ic = {") && !content.includes("Share:")) {
    content = content.replace(/const Ic = \{/, "const Ic = {\n  Share: ({ s=18 }) => <svg width={s} height={s} viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\"><circle cx=\"18\" cy=\"5\" r=\"3\"/><circle cx=\"6\" cy=\"12\" r=\"3\"/><circle cx=\"18\" cy=\"19\" r=\"3\"/><line x1=\"8.59\" y1=\"13.51\" x2=\"15.42\" y2=\"17.49\"/><line x1=\"15.41\" y1=\"6.51\" x2=\"8.59\" y2=\"10.49\"/></svg>,");
  } else if (content.includes("const I = {") && !content.includes("Share:")) {
    content = content.replace(/const I = \{/, "const I = {\n  Share: ({ s=15 }) => <svg width={s} height={s} viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\"><circle cx=\"18\" cy=\"5\" r=\"3\"/><circle cx=\"6\" cy=\"12\" r=\"3\"/><circle cx=\"18\" cy=\"19\" r=\"3\"/><line x1=\"8.59\" y1=\"13.51\" x2=\"15.42\" y2=\"17.49\"/><line x1=\"15.41\" y1=\"6.51\" x2=\"8.59\" y2=\"10.49\"/></svg>,");
  }

  fs.writeFileSync(file, content);
}

