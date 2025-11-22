import { EntitySchema } from "typeorm"

export default new EntitySchema({
  name: "Wallet",
  tableName: "wallets",
  columns: {
    id_wallet: {
      primary: true,
      type: "int",
      generated: true,
    },
    id_usuario: {
      type: "int",
      unique: false,
      nullable: false
    },
    card_number: {
      type: "varchar",
      unique: true,
      nullable: true
    },
    card_cvv: {
      type: "varchar",
      unique: true,
      nullable: true
    },
    card_expiration_date: {
      type: "varchar",
      unique: false,
      nullable: true
    },
    card_type: {
      type: "varchar",
      unique: false,
      nullable: true
    },
    balance: {
        type: "numeric",
        precision: 15,      // números totales
        scale: 2,           // decimales
        nullable: true,
        unique: false,
        default:0
    },
  }
});
