import "dotenv/config.js";
import express from 'express'
import cors from 'cors'
import AppDataSource from './database.js'
import CryptoManager from "./tools/CryptoManager.js";
import TokenManager from "./tools/TokenManager.js";
import Usuario from "./models/Usuario.js";
import Wallet from "./models/Wallet.js";
import { generateFakeCard } from "./tools/fakeCardData.js";
import TransactionCard from "./models/TransactionCard.js";

const card_types = [
  "Corriente",
  "Ahorros",
  "Visa"
]


const app = express()
app.use(cors())
app.use(express.json())

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const validToken = TokenManager.validate(token)
    if (!validToken) return res.json({ success: false, msg: "error, token invalido" })
    req.dataToken = TokenManager.decode(token)
    delete req.dataToken.exp;
    req.token = token;
    return next();
  } else {
    return res.json({ success: false, msg: "error, token invalido" })
  }
};


app.get('/api', async (req, res) => {
  console.clear()
  return res.json({ message: 'API funcionando' })
});

app.get('/api/test', (req, res) => {
  console.clear()
  // console.log(generateFakeCard());
  return res.json({ msg: 'prueba de api' })
});

app.post('/api/register', async (req, res) => {
  await AppDataSource.initialize();
  console.clear()
  try {
    const {
      email,
      fullname,
      password
    } = req.body;

    const replyObj = {
      email,
      fullname,
      password_hash: CryptoManager.hashPassword(password),
    }

    const usuarioRepo = AppDataSource.getRepository(Usuario);
    const usuario = usuarioRepo.create(replyObj);
    const result = await usuarioRepo.save(usuario);
    delete replyObj.password_hash
    replyObj["id_usuario"] = result.id_usuario;
    const token = TokenManager.create(replyObj, 6200);
    return res.json({ success: true, token })
  } catch (error) {
    return res.json({ success: false, msg: "el usuario ya existe" })
  }
});

app.post('/api/login', async (req, res) => {
  await AppDataSource.initialize();
  try {
    const {
      email,
      password
    } = req.body;
    const usuarioRepo = AppDataSource.getRepository(Usuario);
    const usuario = await usuarioRepo.findOneBy({ email });
    if (!usuario) throw new Error("El usuairo no existe");
    const validate = CryptoManager.verifyPassword(password, usuario.password_hash)
    if (!validate) throw new Error("Contraseña invalida");
    const token = TokenManager.create({
      id_usuario: usuario.id_usuario,
      email,
      fullname: usuario.email,
    }, 6200);
    return res.json({ success: true, msg: "ok", token })
  } catch (error) {
    return res.json({ success: false, msg: "error, usuario o email inválidos" })
  }
})

app.get('/api/account', auth, async (req, res) => {
  return res.json({ success: true, msg: 'Hello!! welcome to account', data: req.dataToken })
});


// Problem to auth middleware
app.post('/api/account/makeWallet', auth, async (req, res) => {
  await AppDataSource.initialize();
  try {
    const { card_type } = req.body;
    if (!card_types.includes(card_type)) throw new Error("false");
    const walletRepo = AppDataSource.getRepository(Wallet);
    const cardData = generateFakeCard()
    const wallet = walletRepo.create({
      id_usuario: parseInt(req.dataToken.id_usuario),
      card_number: cardData.card_number,
      card_cvv: cardData.card_cvv,
      card_expiration_date: cardData.card_expiration_date,
      card_type,
    });
    const result = await walletRepo.save(wallet);
    return res.json({ success: true, msg: 'ok', Wallet: result })
  } catch (error) {
    return res.json({ success: false, msg: "error, tipo de tarjeta invalido" })
  }
});

app.get('/api/account/getWallets', auth, async (req, res) => {
  await AppDataSource.initialize();
  try {
    const walletRepo = AppDataSource.getRepository(Wallet);
    const wallets = await walletRepo.find({
      where: { id_usuario: parseInt(req.dataToken.id_usuario) },
      order: { id_usuario: "DESC" }
    });
    return res.json({ success: true, msg: 'ok', Wallets: wallets })
  } catch (error) {
    console.error(error)
    return res.json({ success: false, msg: "error" })
  }
});

app.post('/api/account/deleteWallets', auth, async (req, res) => {
  try {
    const { id_wallet } = req.body;
    if (id_wallet==null) throw new Error("false");
    await AppDataSource.initialize();
    const walletRepo = AppDataSource.getRepository(Wallet);
    await walletRepo.delete({ 
      id_usuario: parseInt(req.dataToken.id_usuario),
      id_wallet: parseInt(id_wallet)
    });
    return res.json({ success: true, message: 'ok, deleted' })
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, msg: "error" })
  }
});


app.post('/api/account/adminTransaction', auth, async (req, res) => {
  console.clear();
  
  try {
     const { 
      wallet,
      amount_transfer, 
    } = req.body;
    if (wallet==null) throw new Error("false");
    if (amount_transfer==null) throw new Error("false");
    await AppDataSource.initialize();
    
    const usuarioRepo = AppDataSource.getRepository(Usuario);
    const usuario = await usuarioRepo.findOneBy({ id_usuario: req.dataToken.id_usuario });
    if (!usuario) throw new Error("El usuario no existe");
    if (!usuario.isAdmin) throw new Error("Acceso denegado");
    
    const WalletRepo = AppDataSource.getRepository(Wallet);
    const wallet_for = await WalletRepo.findOneBy({ 
      id_usuario: usuario.id_usuario,
      card_number: wallet,
    });

    const TransactionCardRepo = AppDataSource.getRepository(TransactionCard);
  
    const transactionCard = TransactionCardRepo.create({
        id_wallet_of: 0,
        id_wallet_for: parseInt(wallet_for.id_wallet),
        amount_transfer: parseFloat(amount_transfer)
    });

    const result = await TransactionCardRepo.save(transactionCard);

    return res.json({ success: true, message: 'ok', result })
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, msg: "error" })
  }
});


app.post('/api/account/transaction', auth, async (req, res) => {
  console.clear()
  try {
    const { 
      wallet_number_of,
      wallet_number_for, 
      amount_transfer 
    } = req.body;
    if (wallet_number_of==null) throw new Error("false");
    if (wallet_number_for==null) throw new Error("false");
    if (amount_transfer==null) throw new Error("false");
    await AppDataSource.initialize();

    
    const usuarioRepo = AppDataSource.getRepository(Usuario);
    const usuario = await usuarioRepo.findOneBy({ id_usuario: req.dataToken.id_usuario });
    if (!usuario) throw new Error("El usuario no existe");
    
    const WalletRepo = AppDataSource.getRepository(Wallet);
    
    const wallet_of = await WalletRepo.findOneBy({ 
      id_usuario: usuario.id_usuario,
      card_number: wallet_number_of,
    });

    if (!wallet_of) throw new Error("Wallet invalida");
    
    const wallet_for = await WalletRepo.findOneBy({ 
      card_number: wallet_number_for,
    });

    if (!wallet_for) throw new Error("Wallet inexistente");
    
    const TransactionCardRepo = AppDataSource.getRepository(TransactionCard);

    const transactionCard = TransactionCardRepo.create({
        id_wallet_of: wallet_of.id_wallet,
        id_wallet_for: wallet_for.id_wallet,
        amount_transfer: parseFloat(amount_transfer)
    });

    const result = await TransactionCardRepo.save(transactionCard);
    
    return res.json({ success: true, msg: 'ok', result })
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, msg: error.message })
  }
});

export default app