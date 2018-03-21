var restify = require('restify');
var builder = require('botbuilder');
var cognitiveservices = require('botbuilder-cognitiveservices');
require('dotenv').load();

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3578, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.get('/', restify.plugins.serveStatic({
    directory: __dirname,
    default: '/default.html'
   }));
server.post('/api/messages', connector.listen());

//=========================================================
// Recognizers
//=========================================================

var qnarecognizer = new cognitiveservices.QnAMakerRecognizer({
    knowledgeBaseId: process.env.QnA_KBID,
    subscriptionKey: process.env.QnA_Key,
    top: 1
});

var model = process.env.LUIS_MODEL_URL;
var recognizer = new builder.LuisRecognizer(model);

//=========================================================
// Bot Dialogs
//=========================================================
var intents = new builder.IntentDialog({ recognizers: [recognizer, qnarecognizer] });
bot.dialog('/', intents);

intents.matches('Greetings', [
    function (session, args, next) {
        var msg = new builder.Message(session).addAttachment(createHeroCard(session));
        session.send(msg);
    }]);

intents.matches('qna' || 'none', [
    function (session, args, next) {
        var answerEntity = builder.EntityRecognizer.findEntity(args.entities, 'answer');
        session.send(answerEntity.entity);
    }
]);

intents.onDefault([
    function (session) {
        session.send('Sorry!! No match!!');
    }
]);

function createHeroCard(session) {
    return new builder.HeroCard(session)
        .title('Demo Chat Bot')
        .subtitle('Your friendly neighbourhood bot')
        .text('Build and connect intelligent bots to interact with your users naturally wherever they are, from text/sms to Skype, Slack, Office 365 mail and other popular services.')
        .images([
            builder.CardImage.create(session, 'https://z.co.nz/assets/Uploads/Who-Is-Z.png')
        ]);
}
