const {
    Client, GatewayIntentBits, PermissionsBitField, ChannelType,
    ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle,
    EmbedBuilder
} = require("discord.js");
require("dotenv").config();
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// DADOS DO .env
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

// BANCO DE DADOS SIMPLES PARA XP
let xpDados = {};
if(fs.existsSync('./xp.json')) xpDados = JSON.parse(fs.readFileSync('./xp.json'));
const salvarXP = () => fs.writeFileSync('./xp.json', JSON.stringify(xpDados, null, 2));

client.once("ready", () => console.log(`✅ 🦊 ${client.user.tag} | FOX-PLAY ONLINE!`));

// ==============================================
// 📢 MENSAGENS AUTOMÁTICAS NOS CANAIS
// ==============================================
client.on("messageCreate", async (msg) => {
    if(msg.author.bot) return;

    // 🎯 CANAL CARGOS
    if(msg.channel.id === CONFIG.canais.cargos && msg.content.toLowerCase() === '!painel' && msg.author.id === CONFIG.seuId){
        const emb = new EmbedBuilder()
        .setColor('#2f3136')
        .setTitle('🎭 Pegar Cargos')
        .setDescription('Clique para receber ou remover os cargos que quiser!');

        const menu = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('c_parceria').setLabel('🤝 Parceria').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('c_youtube').setLabel('📺 YouTube').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('c_leilao').setLabel('💰 Leilão').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('c_aviso').setLabel('🔔 Avisos').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('c_ff').setLabel('🎮 Free Fire').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('c_brain').setLabel('🧠 Brainrots').setStyle(ButtonStyle.Secondary)
        );
        await msg.channel.send({embeds:[emb], components:[menu]});
        return msg.delete().catch(()=>{});
    }

    // 📢 CANAL NEW-PING
    if(msg.channel.id === CONFIG.canais.ping && msg.content.toLowerCase() === '!painel' && msg.author.id === CONFIG.seuId){
        const emb = new EmbedBuilder()
        .setColor('#2f3136')
        .setTitle('📢 Avisos e Pings')
        .setDescription('Clique para receber notificações de novidades!');

        const menu = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('c_parceria').setLabel('🤝 Ping Parceria').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('c_youtube').setLabel('📺 Ping YouTube').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('c_leilao').setLabel('💰 Ping Leilão').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('c_aviso').setLabel('🔔 Ping Avisos').setStyle(ButtonStyle.Primary)
        );
        await msg.channel.send({embeds:[emb], components:[menu]});
        return msg.delete().catch(()=>{});
    }

    // 🎁 CANAL SORTEIO
    if(msg.channel.id === CONFIG.canais.sorteio && msg.content.toLowerCase().startsWith('!sorteio') && msg.author.id === CONFIG.seuId){
        const premio = msg.content.slice(9) || "Prêmio surpresa!";
        const emb = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🎁 NOVO SORTEIO!')
        .setDescription(`**Prêmio:** ${premio}\nClique no botão para participar!`);

        const btn = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('participar_sorteio').setLabel('✅ Participar').setStyle(ButtonStyle.Success)
        );
        await msg.channel.send({embeds:[emb], components:[btn]});
        return msg.delete().catch(()=>{});
    }

    // 🏆 SISTEMA DE XP AUTOMÁTICO
    if(msg.channel.id === CONFIG.canais.xp){
        const id = msg.author.id;
        if(!xpDados[id]) xpDados[id] = { xp: 0, nivel: 1 };
        
        xpDados[id].xp += Math.floor(Math.random() * 5) + 5;
        const xpNecessario = xpDados[id].nivel * 100;

        if(xpDados[id].xp >= xpNecessario){
            xpDados[id].nivel++;
            xpDados[id].xp = 0;
            await msg.channel.send(`🎉 **PARABÉNS ${msg.author}!**\nVocê subiu para o **NÍVEL ${xpDados[id].nivel}** 🚀\nUse \`!rank\` para ver sua posição!`);
        }
        salvarXP();
    }

    // COMANDOS DE XP
    if(msg.content.toLowerCase() === '!rank'){
        const id = msg.author.id;
        if(!xpDados[id]) xpDados[id] = { xp:0, nivel:1 };
        const xpNecessario = xpDados[id].nivel * 100;
        const emb = new EmbedBuilder()
        .setColor('#9932CC')
        .setTitle(`🏆 Rank de ${msg.author.username}`)
        .setDescription(`**Nível:** ${xpDados[id].nivel}\n**XP:** ${xpDados[id].xp}/${xpNecessario}`);
        return msg.channel.send({embeds:[emb]});
    }

    if(msg.content.toLowerCase() === '!ver'){
        const ranking = Object.entries(xpDados).sort((a,b) => b[1].nivel - a[1].nivel).slice(0,10);
        let texto = '';
        ranking.forEach((u,i) => {
            texto += `${i+1}. <@${u[0]}> | Nível ${u[1].nivel}\n`;
        });
        const emb = new EmbedBuilder().setTitle('🏆 TOP 10 SERVIDOR').setDescription(texto || 'Ninguém tem XP ainda!');
        return msg.channel.send({embeds:[emb]});
    }
});

// ==============================================
// 🎯 AÇÕES DOS BOTÕES
// ==============================================
client.on("interactionCreate", async (inter) => {
    if(!inter.isButton()) return;
    await inter.deferReply({ephemeral:true});

    const cargoMap = {
        c_parceria: CONFIG.cargos.parceria,
        c_youtube: CONFIG.cargos.youtube,
        c_leilao: CONFIG.cargos.leilao,
        c_aviso: CONFIG.cargos.aviso,
        c_ff: CONFIG.cargos.freefire,
        c_brain: CONFIG.cargos.brainrots
    };

    if(cargoMap[inter.customId]){
        const cargo = inter.guild.roles.cache.get(cargoMap[inter.customId]);
        if(!cargo) return inter.editReply('❌ Cargo não encontrado!');
        if(inter.member.roles.cache.has(cargo.id)){
            await inter.member.roles.remove(cargo);
            return inter.editReply(`✅ Cargo **${cargo.name}** removido!`);
        } else {
            await inter.member.roles.add(cargo);
            return inter.editReply(`✅ Cargo **${cargo.name}** adicionado!`);
        }
    }

    if(inter.customId === 'participar_sorteio'){
        return inter.editReply('✅ Você entrou no sorteio! Boa sorte!');
    }
});

client.login(process.env.TOKEN);
