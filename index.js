const {
    Client, GatewayIntentBits, PermissionsBitField, ChannelType,
    ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle,
    EmbedBuilder
} = require("discord.js");
require("dotenv").config();
const fs = require('fs');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('🦊 FoxProkks | ONLINE!'));
app.listen(PORT, () => console.log(`✅ Porta ${PORT} ok`));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const CONFIG = {
    seuId: process.env.SEU_ID,
    canais: {
        cargos: process.env.CANAL_CARGOS,
        ping: process.env.CANAL_PING,
        sorteio: process.env.CANAL_SORTEIO,
        xp: process.env.CANAL_XP
    },
    cargos: {
        parceria: process.env.PING_PARCERIA,
        youtube: process.env.PING_YOUTUBE,
        leilao: process.env.PING_LEILAO,
        aviso: process.env.PING_AVISO,
        freefire: process.env.CARGO_FREEFIRE,
        brainrots: process.env.CARGO_BRAINROTS
    }
};

let xpDados = {};
if(fs.existsSync('./xp.json')) xpDados = JSON.parse(fs.readFileSync('./xp.json'));
const salvarXP = () => fs.writeFileSync('./xp.json', JSON.stringify(xpDados, null, 2));

client.once("ready", () => console.log(`✅ 🦊 ${client.user.tag} | FOXPROKKS ONLINE!`));

client.on("messageCreate", async (msg) => {
    if(msg.author.bot || !msg.guild) return;
    const comando = msg.content.toLowerCase().trim();

    // 🎯 COMANDO !PAINEL — FUNCIONA NO CANAL DE CARGOS OU PARA VOCÊ EM QUALQUER LUGAR
    if(comando === '!painel'){
        if(msg.author.id !== CONFIG.seuId) return; // só você usa
        // Se for no canal certo OU se for você, mostra o painel
        if(msg.channel.id === CONFIG.canais.cargos || msg.channel.id === CONFIG.canais.ping){
            const titulo = msg.channel.id === CONFIG.canais.cargos ? '🎭 Pegar Cargos' : '📢 Avisos e Pings';
            const desc = msg.channel.id === CONFIG.canais.cargos ? 'Clique para pegar seus cargos!' : 'Clique para receber notificações!';
            
            const emb = new EmbedBuilder().setColor('#2f3136').setTitle(titulo).setDescription(desc);
            const botoes = msg.channel.id === CONFIG.canais.cargos ? [
                new ButtonBuilder().setCustomId('c_parceria').setLabel('🤝 Parceria').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('c_youtube').setLabel('📺 YouTube').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('c_leilao').setLabel('💰 Leilão').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('c_aviso').setLabel('🔔 Avisos').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('c_ff').setLabel('🎮 Free Fire').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('c_brain').setLabel('🧠 Brainrots').setStyle(ButtonStyle.Secondary)
            ] : [
                new ButtonBuilder().setCustomId('c_parceria').setLabel('🤝 Ping Parceria').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('c_youtube').setLabel('📺 Ping YouTube').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('c_leilao').setLabel('💰 Ping Leilão').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('c_aviso').setLabel('🔔 Ping Avisos').setStyle(ButtonStyle.Primary)
            ];

            await msg.channel.send({embeds:[emb], components:[new ActionRowBuilder().addComponents(botoes)]});
            return msg.delete().catch(()=>{});
        }
    }

    // 🏆 XP AUTOMÁTICO
    if(msg.channel.id === CONFIG.canais.xp){
        const id = msg.author.id;
        if(!xpDados[id]) xpDados[id] = { xp:0, nivel:1 };
        xpDados[id].xp += Math.floor(Math.random()*5)+5;
        const nec = xpDados[id].nivel * 100;
        if(xpDados[id].xp >= nec){
            xpDados[id].nivel++;
            xpDados[id].xp = 0;
            await msg.channel.send(`🎉 ${msg.author} subiu para **NÍVEL ${xpDados[id].nivel}**! 🚀 Use !rank`);
        }
        salvarXP();
    }

    // 📊 COMANDOS DE XP — FUNCIONA EM QUALQUER CANAL
    if(comando === '!rank'){
        const id = msg.author.id;
        if(!xpDados[id]) xpDados[id] = {xp:0, nivel:1};
        const nec = xpDados[id].nivel * 100;
        return msg.channel.send({embeds:[new EmbedBuilder().setColor('#9932CC').setTitle(`🏆 ${msg.author.username}`).setDescription(`Nível: ${xpDados[id].nivel}\nXP: ${xpDados[id].xp}/${nec}`)]});
    }

    if(comando === '!ver'){
        const top = Object.entries(xpDados).sort((a,b)=>b[1].nivel - a[1].nivel).slice(0,10);
        let txt = '';
        top.forEach((u,i)=> txt += `${i+1}. <@${u[0]}> | Nível ${u[1].nivel}\n`);
        return msg.channel.send({embeds:[new EmbedBuilder().setTitle('🏆 TOP 10').setDescription(txt || 'Ninguém tem XP ainda!')]});
    }

    // 🎁 SORTEIO
    if(comando.startsWith('!sorteio') && msg.author.id === CONFIG.seuId && msg.channel.id === CONFIG.canais.sorteio){
        const premio = msg.content.slice(9).trim() || 'Prêmio surpresa';
        await msg.channel.send({
            embeds:[new EmbedBuilder().setColor('#FFD700').setTitle('🎁 NOVO SORTEIO!').setDescription(`Prêmio: ${premio}`)],
            components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('participar_sorteio').setLabel('✅ Participar').setStyle(ButtonStyle.Success))]
        });
        return msg.delete().catch(()=>{});
    }
});

// BOTÕES
client.on("interactionCreate", async (i) => {
    if(!i.isButton()) return;
    await i.deferReply({ephemeral:true});

    const mapa = {
        c_parceria: CONFIG.cargos.parceria,
        c_youtube: CONFIG.cargos.youtube,
        c_leilao: CONFIG.cargos.leilao,
        c_aviso: CONFIG.cargos.aviso,
        c_ff: CONFIG.cargos.freefire,
        c_brain: CONFIG.cargos.brainrots
    };

    if(mapa[i.customId]){
        const c = i.guild.roles.cache.get(mapa[i.customId]);
        if(!c) return i.editReply('❌ Cargo não encontrado!');
        if(i.member.roles.cache.has(c.id)){
            await i.member.roles.remove(c);
            return i.editReply(`✅ ${c.name} REMOVIDO!`);
        }else{
            await i.member.roles.add(c);
            return i.editReply(`✅ ${c.name} ADICIONADO!`);
        }
    }

    if(i.customId === 'participar_sorteio') return i.editReply('✅ Participou! Boa sorte!');
});

client.login(process.env.TOKEN);
                                       
