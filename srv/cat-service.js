const cds = require('@sap/cds');
const xlsx = require('xlsx');

function streamToBuffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    readable.on("end", () => resolve(Buffer.concat(chunks)));
    readable.on("error", reject);
  });
}

async function readFile (file) {
    const buffer = await streamToBuffer(file);

    const workbook = xlsx.read(buffer, {
            type: 'buffer'
        });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
    return rows;
}

module.exports = cds.service.impl(async function () {
    this.on('getDashboardData', async (req) => {
        const { Sheets } = this.entities;
        const { ID } = req.data;
        const tx = this.transaction(req);

        const data = await tx.run(SELECT.one.from(Sheets).where({ ID }));
        
        if(!data) {
            req.reject(404, 'No data found.');
            return ({ message: 'No data found.' });
        }

        return JSON.stringify(data);
    });

    this.after('CREATE', 'Sheets', async (data, req) => {
        const { ID } = data;
        const { Sheets } = this.entities;
        const tx = this.transaction(req);

        const file = await tx.run(SELECT.one.from(Sheets).columns('file').where({ ID }));

        if(!file) {
            req.reject(404, 'No data found.');
            return ({ message: 'No data found.' });
        }

        //creators aggregation
        const rows = await readFile(file.file);
        if(rows.length <= 0) {
            req.reject(404, 'No data found.');
            return ({ message: 'No data found.' });
        }

        let creatorsArray = [];
        let datesArray = [];
        rows.forEach(r => {
            const creator = r['Created By'];
            const date = r['Date'];
            if(!creatorsArray.includes(creator)) {
                creatorsArray.push(creator);
            }

            if(!datesArray.includes(date)) {
                datesArray.push(date);
            }
        });

        const creators = creatorsArray.map(c => {
            const creatorRows = rows.filter(r => r['Created By'] === c);
            let creationDates = [];
            creatorRows.forEach(r => {
                const date = r['Date']
                if(!creationDates.includes(date)) {
                    creationDates.push(date);
                }
            });

            const creator = c;
            const totalRITMs = creatorRows.length;
            const creationsPerDate = creationDates.map(d => {
                const RITMs = creatorRows.filter(r => r['Date'] === d);
                return {
                    date: d,
                    totalRITMs: RITMs.length
                };
            });

            return {
                creator,
                totalRITMs,
                creationsPerDate
            }
        });

        const creationDates = datesArray.map(d => {
            const RITMs = rows.filter(r => r['Date'] === d);
            return {
                date: d,
                totalRITMs: RITMs.length
            };
        });

        const aggregations = { creators, creationDates };
        await tx.run(UPDATE(Sheets).set({ aggregations }).where({ ID }));
    });
});