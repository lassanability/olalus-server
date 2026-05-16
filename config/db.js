const mongoose = require("mongoose");

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_CONNECTION_URL, {
            dbName: process.env.DB_NAME,
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('[+] MongoDB connected successfully');
    } catch (err) {
        console.log(`[-] MongoDB connection error: ${err.message}`);
        process.exit(1);
    }
}

async function deleteAllData() {
    try {
        if (!mongoose.connection || !mongoose.connection.db) {
            console.log('[-] No active MongoDB connection');
            return false;
        }

        const collections = await mongoose.connection.db.listCollections().toArray();

        await Promise.all(
            collections.map(({ name }) =>
                mongoose.connection.db.collection(name).deleteMany({})
            )
        );

        console.log(`[+] Cleared ${collections.length} collection(s)`);
        return true;
    } catch (err) {
        console.log(`[-] MongoDB deletion error: ${err.message}`);
        return false;
    }
}

await connectDB();
await deleteAllData();

module.exports = { connectDB, deleteAllData };