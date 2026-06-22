
(Get-Content src\Analytics.jsx) -replace "// --- Main Analytics Component -------------------------------------------------", "// --- Main Analytics Component -------------------------------------------------`n/** Main Analytics Dashboard containing all reporting tabs */" | Set-Content src\Analytics.jsx
git add src\Analytics.jsx
git commit -m "docs: Add component documentation for Analytics main"
git push origin main

