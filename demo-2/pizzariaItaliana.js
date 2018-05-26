/**
 *
 * Arquivo: pizzariaItaliana.js
 * Data: 26/02/2018
 * Descrição: Desenvolvimento de um Bot de pedido de pizza integrado com o LUIS.
 * Author: Glaucia Lemos
 *
 */

//Aqui estou carregando os enviroments que estão vindo do
//arquivo 'env':
require("dotenv-extended").load({
  path: "../.env"
});

var moment = require("moment");
var builder = require("botbuilder");
var restify = require("restify");

var server = restify.createServer();

//===> Configuração do Bot:
var connector = new builder.ChatConnector({
  appId: "",
  appPassword: ""
});

var bot = new builder.UniversalBot(connector);

//===> Configuração LUIS:
var recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });

//===> Configuração dos 'Intents'(Intenções):

//Endpoint - Saudar:
intents.matches("Saudar", (session, results) => {
  session.send("Oi! Tudo bem? Em que eu posso ajudar?");
});

//Endpoint - Pedir:
intents.matches("Pedir", [
  (session, args, next) => {
    var pizzas = [
      "Quatro Queijos",
      "Calabreza",
      "Frango Catupiri",
      "Margarita",
      "Portuguesa",
      "Mussarela",
      "Especializada"
    ];
    var entityPizza = builder.EntityRecognizer.findEntity(args.entities, "Pizza");

    //Aqui estaremos verificando com o LUIS os melhores 'matches' para a solicitação
    //do pedido da pizza através da Entidade: Pizza:
    if (entityPizza) {
      var match = builder.EntityRecognizer.findBestMatch(pizzas, entityPizza.entity);
    }

    //Caso não encontre o que o usuário está solicitando:
    if (!match) {
      builder.Prompts.choice(session, "No momento só temos estas pizzas disponíveis. Qual que você gostaria de pedir?", pizzas);
    } else {
      next({ response: match });
    }
  },
  function(session, results) {
    //Aqui é para indicar em quanto tempo o pedido da pizza deverá ser entregue: em 30 minutos:
    if (results.response) {
      var time = moment().add(30, "m");

      session.dialogData.time = time.format("HH:mm");
      session.send("Pronto! Sua pizza de **%s** chegará às **%s**.", results.response.entity, session.dialogData.time);
    } else {
      session.send("Sem problemas! Se não gostarem, podem pedir numa próxima vez! :D");
    }
  }
]);

//Endpoint - Cancelar:
intents.matches("Cancelar", (session, results) => {
  session.send("Pedido cancelado com sucesso! Muito Obrigada! Até a próxima!");
});

//Endpoint - Verificar:
intents.matches("Verificar", (session, results) => {
  session.send("Sua pizza chegará às **%s**", session.dialogData.time);
});

//Endpoint - Default:
var teste = intents.onDefault(
  builder.DialogAction.send("Desculpe! Mas, não entendi o que você quis pedir!")
);

bot.dialog("/", intents);

//Configuração do Servidor via Restify:
server.post("/api/messages", connector.listen());

server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log("Aplicação executando na porta %s", server.name, server.url);
});
