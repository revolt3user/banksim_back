import { DataSource } from "typeorm";
import Usuario from "./models/Usuario.js";
import Wallet from "./models/Wallet.js";
import TransactionCard from "./models/TransactionCard.js";

const AppDataSource = new DataSource({
  type: process.env.TYPE,
  host: process.env.HOST,
  port: process.env.PORT,
  username: process.env.USERNAME,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  synchronize: true,
  logging: false,
  entities: [Usuario, Wallet, TransactionCard],
  extra: {
    ssl: {
      rejectUnauthorized: true,
      // Neon puede requerir channelBinding: 'require'
      channelBinding: 'require'
    }
  }
});

export default AppDataSource;
