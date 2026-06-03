import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "./firebase-admin.js";

import {
  MercadoPagoConfig,
  PreApproval
} from "mercadopago";

console.log("=================================");
console.log("ESTE ES MI SERVER NUEVO");
console.log("=================================");

dotenv.config();

console.log("MP_ACCESS_TOKEN:");

if (process.env.MP_ACCESS_TOKEN) {
  console.log(
    process.env.MP_ACCESS_TOKEN.substring(0, 20) + "..."
  );
} else {
  console.log("NO EXISTE");
}
const app = express();

app.use(cors());
app.use(express.json());

const db = admin.firestore();

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const preApproval = new PreApproval(client);

app.get("/", (req, res) => {
  res.send("Backend Mercado Pago funcionando");
});

app.get("/ruta-prueba", (req, res) => {
  res.json({
    ok: true,
    mensaje: "AUREON SERVER"
  });
});

app.get("/test123", (req, res) => {
  res.send("SOY EL SERVER CORRECTO");
});


app.post(
  "/create-subscription",
  async (req, res) => {
    console.log("ENTRO A CREATE SUBSCRIPTION");
    try {

      const authHeader =
        req.headers.authorization;

        console.log("========== AUTH HEADER ==========");
console.log(authHeader);

      if (!authHeader) {

        return res.status(401).json({
          error: "No autorizado",
        });

      }

      const token =
        authHeader.replace(
          "Bearer ",
          ""
        );

        console.log("========== TOKEN ==========");
console.log(token.substring(0, 30));

      const decoded =
        await admin
          .auth()
          .verifyIdToken(token);

          console.log("========== TOKEN VALIDO ==========");
console.log(decoded.uid);
console.log(decoded.email);

      const uid = decoded.uid;
      console.log("EMAIL USUARIO:");
console.log(decoded.email);

      const clienteDoc =
        await db
          .collection("clientes")
          .doc(uid)
          .get();

      if (!clienteDoc.exists) {

        return res.status(404).json({
          error:
            "Cliente no encontrado",
        });

      }

      const clienteData =
        clienteDoc.data();

        console.log("CLIENTE DATA:");
console.log(clienteData);

      const codigoCliente =
        clienteData.codigoCliente;
const correoMP =
  clienteData.mercadoPagoEmail ||
  clienteData.email;
console.log(
  "Correo MP:",
  clienteData.mercadoPagoEmail
);

      const subscription =
        await preApproval.create({

          body: {

            reason:
              "Renta Mensual Sitio Web",


      external_reference:
        codigoCliente,

            auto_recurring: {

              frequency: 1,

              frequency_type:
                "months",

              transaction_amount:10,


              currency_id:
                "MXN",

            },

           back_url:
  "https://google.com",

            status:
              "pending",

          },

        });

        console.log("========== SUSCRIPCION CREADA ==========");
console.log("SUB ID:", subscription.id);
console.log("INIT POINT:", subscription.init_point);
console.log(subscription);

      await db
        .collection("clientes")
        .doc(uid)
        .update({

          mercadoPagoPreapprovalId:
            subscription.id,

        });

      res.json({

        init_point:
          subscription.init_point,

      });

    } catch (error) {

  console.log("========== ERROR MP ==========");
  console.dir(error, { depth: null });

  if (error.cause) {
    console.log("========== CAUSE ==========");
    console.dir(error.cause, { depth: null });
  }

  res.status(500).json({
    error: error.message,
  });

}
  }
);

app.post(
  "/webhook",
  async (req, res) => {

    try {

      console.log(
        "WEBHOOK MP"
      );

      console.log(req.body);

      res.sendStatus(200);

    } catch (error) {

      console.log(error);

      res.sendStatus(500);

    }

  }
);

const PORT =
  process.env.PORT || 3001;

  setInterval(() => {
  console.log("SERVER VIVO");
}, 5000);

app.listen(PORT, () => {

  console.log(
    "Servidor iniciado en puerto",
    PORT
  );

});
