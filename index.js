
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const TRANSACTIONS_DIR = "./transactions-data";

// Variables storage
const dailySalesVolume = {};
const dailySalesValue = {};
const productSales = {};
const salesStaffMonthly = {};
const hourlyTransactionCount = {};

async function processEachTransactionFile(filePath) {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
        const [salesStaffId, transactionTime, products, saleAmount] = line.split(",");

        const date = transactionTime.split("T")[0];
        const month = date.substring(0, 7);
        const hour = transactionTime.split("T")[1]?.split(":")[0]; // Hour

        const amount = parseFloat(saleAmount);
        const productEntries = products.match(/\d+:\d+/g) || [];

        // Sales vol. and val.
        dailySalesVolume[date] = (dailySalesVolume[date] || 0) + 1;
        dailySalesValue[date] = (dailySalesValue[date] || 0) + amount;

        // products and quantity
        for (const entry of productEntries) {
            const [productId, quantity] = entry.split(":").map(Number);
            productSales[productId] = (productSales[productId] || 0) + quantity;
        }

        // For sales staff
        if (!salesStaffMonthly[month]) salesStaffMonthly[month] = {};
        salesStaffMonthly[month][salesStaffId] = (salesStaffMonthly[month][salesStaffId] || 0) + amount;

        // transactions per hour
        hourlyTransactionCount[hour] = (hourlyTransactionCount[hour] || 0) + 1;
    }
}


function getMaxEntry(obj) {
    return Object.entries(obj).reduce((max, entry) => (entry[1] > max[1] ? entry : max), ["None", 0]);
}

//Main
async function processAllFiles() {
    const files = fs.readdirSync(TRANSACTIONS_DIR);
    for (const file of files) {
        if (file.endsWith(".txt")) {
            await processEachTransactionFile(path.join(TRANSACTIONS_DIR, file));
        }
    }

    // final results

    const highestSalesDay = getMaxEntry(dailySalesVolume);
    const highestSalesValueDay = getMaxEntry(dailySalesValue);
    const mostSoldProduct = getMaxEntry(productSales);
    const highestSalesHour = getMaxEntry(hourlyTransactionCount);

    const topSalesStaffPerMonth = Object.fromEntries(
        Object.entries(salesStaffMonthly).map(([month, staffSales]) => [month, getMaxEntry(staffSales)[0]])
    );

    console.log("ANALYTICS RESULTS");
    console.log(`Highest sales volume in a day: ${highestSalesDay[0]}(${highestSalesDay[1]} transactions)`);
    console.log(`Highest sales value in a day: ${highestSalesValueDay[0]}($${highestSalesValueDay[1].toFixed(2)})`);
    console.log(`Most sold product by volume: Product ID ${mostSoldProduct[0]}(${mostSoldProduct[1]} units)`);
    console.log(`Highest sales hour(average transactions): ${highestSalesHour[0]}:00(${highestSalesHour[1]} transactions)`);
    console.log("Highest sales staff per month:");
    console.table(topSalesStaffPerMonth);


}

processAllFiles().catch(console.error)