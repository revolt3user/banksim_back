import { EntitySchema } from "typeorm"

export default new EntitySchema({
    name: "TransactionCard",
    tableName: "transactionCard",
    columns: {
        id_transaction: {
            primary: true,
            type: "int",
            generated: true,
        },
        id_wallet_send: {
            type: "int",
            unique: false,
            nullable: false
        },
        id_wallet_receiver: {
            type: "int",
            unique: false,
            nullable: false
        },
        amount_transfer: {
            type: "numeric",
            precision: 15,      // números totales
            scale: 2,           // decimales
            nullable: false
        },
        transaction_date: {
            type: "date",
            unique: false,
            nullable: true,
            default: () => "CURRENT_DATE"
        },
    }
});
