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
        const datesSorted = [...creationDates];
        datesSorted.sort((a, b) => new Date(a.date) - new Date(b.date));
        const dateRange = `${datesSorted.shift().date} - ${datesSorted.pop().date}`;
        const uploadedBy = req.user.id || 'TEST USER';
        const dateUploaded = new Date().toISOString().split('T')[0];
        const timestamp = String(new Date().getTime());

        await tx.run(UPDATE(Sheets).set({ uploadedBy, dateRange, dateUploaded, timestamp, aggregations }).where({ ID }));
    });

    this.on('getDashboardTilesData', async (req) => {
        const { ID } = req.data;
        const { Sheets } = this.entities;
        const tx = this.transaction(req);
        const sheet = await tx.run(SELECT.one.from(Sheets, s => {
                                                        s.name, s.dateRange, s.aggregations(a => {
                                                            a.creators(c => {
                                                                c.creator, c.totalRITMs
                                                            }), a.creationDates(cd => {
                                                                cd.date, cd.totalRITMs
                                                            })
                                                        })
                                                    }).where({ ID }));
        if(!sheet) {
            req.reject(404, 'No data found.');
            return;
        }
        const fileSource = sheet.name;
        const totalRITMs = sheet.aggregations.creators.reduce((total, c) => total += c.totalRITMs, 0);
        const uniqueCreators = sheet.aggregations.creators.length;

        const sortedCreators = sheet.aggregations.creators.sort((a, b) => b.totalRITMs - a.totalRITMs);
        const topCreators = sortedCreators.filter(c => c.totalRITMs === sortedCreators[0].totalRITMs);
        
        const dateRange = sheet.dateRange;

        const sortedDays = sheet.aggregations.creationDates.sort((a, b) => b.totalRITMs - a.totalRITMs);
        const busiestDays = sortedDays.filter(d => d.totalRITMs === sortedDays[0].totalRITMs);

        const avgRITMsPerDay = sheet.aggregations.creationDates.reduce((total, d) => total += d.totalRITMs, 0)/sheet.aggregations.creationDates.length;

        return JSON.stringify({ fileSource, totalRITMs, uniqueCreators, topCreators, dateRange, busiestDays, avgRITMsPerDay: avgRITMsPerDay.toFixed(2) });
    });
});