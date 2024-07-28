const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// Utiliser LocalAuth pour la persistance de la session
const client = new Client({
    authStrategy: new LocalAuth()
});

// Générer et afficher le QR code pour l'authentification
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR code généré, scannez-le avec votre téléphone.');
});

// Connexion réussie
client.on('ready', () => {
    console.log('Le client est prêt.');
});

// Tableau des surnoms affectueux
const surnoms = [
    { arabe: "حبيبتي", transliteration: "Habibti", signification: "mon amour" },
    { arabe: "عمري", transliteration: "Omri", signification: "ma vie" },
    { arabe: "روحي", transliteration: "Rouhi", signification: "mon âme" },
    { arabe: "غاليتي", transliteration: "Ghalyti", signification: "ma précieuse" },
    { arabe: "زهرتي", transliteration: "Zahreti", signification: "ma fleur" },
    { arabe: "قمر", transliteration: "Qamar", signification: "mon étoile" },
    { arabe: "أميرة", transliteration: "Amira", signification: "princesse" },
    { arabe: "نور عيني", transliteration: "Noor 'Ayni", signification: "la lumière de mes yeux" },
    { arabe: "ملاكي", transliteration: "Malaki", signification: "mon ange" },
    { arabe: "دنيتي", transliteration: "Dunyati", signification: "mon monde" }
];

const myId = '221762773266@c.us';

// Réception de messages
client.on('message', async message => {
    console.log(`Message reçu de ${message.from}: ${message.body}`);

    // Répondre au message
    if (message.body.toLowerCase() === 'bonjour') {
        message.reply('Bonjour ! Comment puis-je vous aider aujourd\'hui ?');
    }

    console.log((message.from === myId))

    if (message.body.includes('#surnom')) {
        const randomSurnom = surnoms[Math.floor(Math.random() * surnoms.length)];
        const replyMessage = `${randomSurnom.arabe} (${randomSurnom.transliteration}) - Signifie "${randomSurnom.signification}".`;
        message.reply(replyMessage);
    }

    // Vérifier si le message provient d'un statut
    if (message.from.includes('status')) {

        // Enregistrer le statut
        if (message.hasMedia) {
            try {
                const media = await message.downloadMedia();
                if (media && media.mimetype) {
                    const mediaExtension = media.mimetype.split('/')[1];
                    const filePath = path.join(__dirname, `status-files/${message.id.id}.${mediaExtension}`);
                    fs.writeFile(filePath, media.data, 'base64', (err) => {
                        if (err) {
                            console.error('Erreur lors de la sauvegarde du statut :', err);
                        } else {
                            console.log(`Statut enregistré : ${filePath}`);
                        }
                    });
                } else {
                    console.error('Le média téléchargé n\'a pas de type MIME ou est invalide.');
                }
            } catch (err) {
                console.error('Erreur lors du téléchargement du média du statut :', err);
            }
        } else {
            console.log('Le statut ne contient pas de média.');
        }
    }

    // Fonctionnalité pour tagger tous les membres d'un groupe uniquement si le message provient de vous (fromMe)
    if (message.body.toLowerCase() === '#tagall' && message.fromMe) {
        console.log("Commande #tagall détectée provenant de vous");
        const chat = await message.getChat();
        console.log(`Chat is group: ${chat.isGroup}`);
        if (chat.isGroup) {
            let mentions = [];
            let text = '══✪〘   Tag All   〙✪══\n\n➲ Message : blank Message\n';

            for (let participant of chat.participants) {
                console.log(`Participant ID: ${participant.id._serialized}`);
                const contact = await client.getContactById(participant.id._serialized);
                console.log(`Contact: ${contact.pushname || contact.number}`);
                mentions.push(contact);
                text += `@${contact.pushname || contact.number}\n`;
            }

            console.log(`Mentions: ${mentions.map(c => c.id._serialized).join(', ')}`);
            chat.sendMessage(text, { mentions }).then(response => {
                console.log('Message envoyé avec les mentions.');
            }).catch(err => {
                console.error('Erreur lors de l\'envoi du message avec mentions :', err);
            });
        } else {
            console.log('Le message n\'a pas été envoyé car ce n\'est pas un groupe.');
        }
    }

    // Fonctionnalité pour enregistrer les fichiers médias reçus, y compris les PDF
    if (message.hasMedia) {
        try {
            const media = await message.downloadMedia();
            if (media && media.mimetype) {
                const mediaExtension = media.mimetype.split('/')[1];
                const filePath = path.join(__dirname, `received-files/${message.id.id}.${mediaExtension}`);
                fs.writeFile(filePath, media.data, 'base64', (err) => {
                    if (err) {
                        console.error(`Erreur lors de la sauvegarde du fichier média (${media.mimetype}) :`, err);
                    } else {
                        console.log(`Fichier média enregistré : ${filePath}`);
                    }
                });
            } else {
                console.error('Le média téléchargé n\'a pas de type MIME ou est invalide.');
            }
        } catch (err) {
            console.error('Erreur lors du téléchargement du média :', err);
        }
    }
});

// Initialiser le client
client.initialize();
