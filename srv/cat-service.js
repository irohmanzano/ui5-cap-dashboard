const cds = require('@sap/cds');
const xlsx = require('xlsx')

function streamToBuffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    readable.on("end", () => resolve(Buffer.concat(chunks)));
    readable.on("error", reject);
  });
}

module.exports = cds.service.impl(async function () {
    this.on('readFile', async (req) => {
        const { Sheets } = this.entities;
        const { ID } = req.data;
        const tx = this.transaction(req);

        const file = await tx.run(SELECT.one.from(Sheets).columns('file').where({ ID }));

        
        if(!file) {
            req.reject(404, 'No data found.');
            return ({ message: 'File data cannot be read.' });
        }
        
        const buffer = await streamToBuffer(file.file);

        const workbook = xlsx.read(buffer, {
            type: 'buffer'
        });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

        return JSON.stringify(rows);
    });
});