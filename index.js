const {
    Client, GatewayIntentBits, PermissionsBitField, ChannelType,
    ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle
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

// DADOS DO SORTEIO
let sorteioAtual = null;
let xpDados = {};
if(fs.existsSync('./xp.json')) xpDados = JSON.parse(fs.readFileSync('./xp.json'));
const salvarXP = () => fs.writeFileSync('./xp.json', JSON.stringify(xpDados, null, 2));

client.on("ready", () => console.log(`✅ 🦊 ${client.user.tag} | FOXPROKKS ONLINE!`));

client.on("messageCreate", async (msg) => {
    if(msg.author.bot || !msg.guild) return;
    const comando = msg.content.toLowerCase().trim();

    // 🎯 COMANDO !cargos
    if(comando === '!cargos'){
        if(msg.author.id !== CONFIG.seuId) return;
        await msg.delete().catch(()=>{});
        if(msg.channel.id === CONFIG.canais.cargos){
            const emb = new EmbedBuilder().setColor('#2f3136').setTitle('🎭 Pegar Cargos').setDescription('Clique para receber ou remover os cargos!');
            const botoes = [
                new ButtonBuilder().setCustomId('c_parceria').setLabel('🤝 Parceria').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('c_youtube').setLabel('📺 YouTube').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('c_leilao').setLabel('💰 Leilão').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('c_aviso').setLabel('🔔 Avisos').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('c_ff').setLabel('🎮 Free Fire').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('c_brain').setLabel('🧠 Brainrots').setStyle(ButtonStyle.Secondary)
            ];
            return msg.channel.send({embeds:[emb], components:[new ActionRowBuilder().addComponents(botoes)]});
        }
    }

    // 📢 COMANDO !painel
    if(comando === '!painel'){
        if(msg.author.id !== CONFIG.seuId) return;
        await msg.delete().catch(()=>{});
        if(msg.channel.id === CONFIG.canais.ping){
            const emb = new EmbedBuilder().setColor('#2f3136').setTitle('📢 Avisos e Pings').setDescription('Clique para receber notificações!');
            const botoes = [
                new ButtonBuilder().setCustomId('c_parceria').setLabel('🤝 Ping Parceria').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('c_youtube').setLabel('📺 Ping YouTube').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('c_leilao').setLabel('💰 Ping Leilão').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('c_aviso').setLabel('🔔 Ping Avisos').setStyle(ButtonStyle.Primary)
            ];
            return msg.channel.send({embeds:[emb], components:[new ActionRowBuilder().addComponents(botoes)]});
        }
    }

    // 🎁 COMANDO !sorteio — PAINEL DE CONFIGURAÇÃO
    if(comando === '!sorteio'){
        if(msg.author.id !== CONFIG.seuId) return;
        await msg.delete().catch(()=>{});

        sorteioAtual = {
            descricao: "Novo Sorteio!",
            imagem: null,
            cargosPermitidos: [],
            participantes: [],
            canal: msg.channel.id
        };

        const embConfig = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('⚙️ Configurar Sorteio')
        .setDescription(`Configure tudo antes de enviar:

📝 **Descrição + Imagem**
Altere o texto e coloque uma foto do prêmio.

👥 **Cargos Permitidos**
Apenas quem tiver esses cargos pode participar.

📤 **Enviar Sorteio**
Depois de configurar, clique para liberar para todos!`);

        const botoesConfig = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('sort_descricao').setLabel('📝 Descrição+Imagem').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('sort_cargos').setLabel('👥 Cargos Permitidos').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('sort_enviar').setLabel('📤 Enviar Sorteio').setStyle(ButtonStyle.Success)
        );

        return msg.channel.send({embeds:[embConfig], components:[botoesConfig]});
    }

    // 🔚 COMANDO !acaba — ENCERRA SORTEIO
    if(comando === '!acaba'){
        if(msg.author.id !== CONFIG.seuId) return;
        await msg.delete().catch(()=>{});
        if(!sorteioAtual) return msg.channel.send('❌ Não há sorteio acontecendo!');

        if(sorteioAtual.participantes.length === 0) return msg.channel.send('❌ Ninguém participou do sorteio!');

        const ganhador = sorteioAtual.participantes[Math.floor(Math.random() * sorteioAtual.participantes.length)];
        const embFim = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🏆 SORTEIO ENCERRADO!')
        .setDescription(`**Vencedor:** <@${ganhador}> 🎉\nParabéns!`);

        const botoesFim = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('sort_rollnovamente').setLabel('🎲 Sortear Novamente').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('sort_encerrar').setLabel('✅ Encerrar').setStyle(ButtonStyle.Danger)
        );

        await msg.channel.send({embeds:[embFim], components:[botoesFim]});
    }

    // 🏆 SISTEMA DE XP
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

    // 📊 COMANDOS DE XP
    if(comando === '!rank'){
        const id = msg.author.id;
        if(!xpDados[id]) xpDados[id] = {xp:0, nivel:1};
        const nec = xpDados[id].nivel * 100;
        const res = await msg.channel.send({embeds:[new EmbedBuilder().setColor('#9932CC').setTitle(`🏆 ${msg.author.username}`).setDescription(`Nível: ${xpDados[id].nivel}\nXP: ${xpDados[id].xp}/${nec}`)]});
        setTimeout(() => {msg.delete().catch(()=>{}); res.delete().catch(()=>{});}, 10000);
        return;
    }

    if(comando === '!ver'){
        const top = Object.entries(xpDados).sort((a,b)=>b[1].nivel - a[1].nivel).slice(0,10);
        let txt = '';
        top.forEach((u,i)=> txt += `${i+1}. <@${u[0]}> | Nível ${u[1].nivel}\n`);
        const res = await msg.channel.send({embeds:[new EmbedBuilder().setTitle('🏆 TOP 10').setDescription(txt || 'Ninguém tem XP!')]});
        setTimeout(() => {msg.delete().catch(()=>{}); res.delete().catch(()=>{});}, 10000);
        return;
    }
});

// 🎯 AÇÕES DOS BOTÕES
client.on("interactionCreate", async (i) => {
    if(!i.isButton()) return;
    await i.deferUpdate();

    // SORTEIO: DESCRIÇÃO + IMAGEM
    if(i.customId === 'sort_descricao'){
        const modal = new ModalBuilder().setCustomId('modal_sort_desc').setTitle('📝 Descrição e Imagem').addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('texto').setLabel('Descrição do Sorteio').setStyle(TextInputStyle.Paragraph).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('imagem').setLabel('Link da Imagem').setStyle(TextInputStyle.Short).setRequired(false))
        );
        return i.showModal(modal);
    }

    // SORTEIO: CARGOS PERMITIDOS
    if(i.customId === 'sort_cargos'){
        const modal = new ModalBuilder().setCustomId('modal_sort_cargos').setTitle('👥 Cargos Permitidos').addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ids').setLabel('IDs dos Cargos (separado por vírgula)').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('Deixe vazio para todos participarem'))
        );
        return i.showModal(modal);
    }

    // SORTEIO: ENVIAR PAINEL
    if(i.customId === 'sort_enviar'){
        if(!sorteioAtual) return i.followUp({content:'❌ Comece um novo sorteio!', ephemeral:true});
        const emb = new EmbedBuilder().setColor('#FFD700').setTitle('🎁 NOVO SORTEIO!').setDescription(sorteioAtual.descricao);
        if(sorteioAtual.imagem) emb.setImage(sorteioAtual.imagem);
        const btn = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('sort_participar').setLabel('✅ Participar').setStyle(ButtonStyle.Success));
        await i.channel.send({embeds:[emb], components:[btn]});
        return i.followUp({content:'✅ Sorteio enviado!', ephemeral:true});
    }

    // PARTICIPAR DO SORTEIO
    if(i.customId === 'sort_participar'){
        if(!sorteioAtual) return i.reply({content:'❌ Sorteio encerrado!', ephemeral:true});
        if(sorteioAtual.cargosPermitidos.length > 0){
            const temCargo = sorteioAtual.cargosPermitidos.some(id => i.member.roles.cache.has(id));
            if(!temCargo) return i.reply({content:'❌ Você não tem cargo permitido para participar!', ephemeral:true});
        }
        if(sorteioAtual.participantes.includes(i.user.id)) return i.reply({content:'✅ Você já está participando!', ephemeral:true});
        sorteioAtual.participantes.push(i.user.id);
        return i.reply({content:`✅ Participando! Total: ${sorteioAtual.participantes.length}`, ephemeral:true});
    }

    // SORTEAR NOVAMENTE
    if(i.customId === 'sort_rollnovamente'){
        if(!sorteioAtual || sorteioAtual.participantes.length === 0) return;
        const novo = sorteioAtual.participantes[Math.floor(Math.random() * sorteioAtual.participantes.length)];
        return i.channel.send(`🎲 NOVO SORTEIO: <@${novo}> 🎉`);
    }

    // ENCERRAR DE VEZ
    if(i.customId === 'sort_encerrar'){
        sorteioAtual = null;
        return i.channel.send('✅ Sorteio encerrado e finalizado!');
    }

    // SISTEMA DE CARGOS
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
        if(!c) return i.followUp({content:'❌ Cargo não encontrado!', ephemeral:true});
        if(i.member.roles.cache.has(c.id)){
            await i.member.roles.remove(c);
            return i.followUp({content:`✅ ${c.name} REMOVIDO!`, ephemeral:true});
        }else{
            await i.member.roles.add(c);
            return i.followUp({content:`✅ ${c.name} ADICIONADO!`, ephemeral:true});
        }
    }
});

// RECEBE OS DADOS DOS MODAIS
client.on("interactionCreate", async (i) => {
    if(!i.isModalSubmit()) return;
    await i.deferReply({ephemeral:true});

    if(i.customId === 'modal_sort_desc'){
        sorteioAtual.descricao = i.fields.getTextInputValue('texto');
        sorteioAtual.imagem = i.fields.getTextInputValue('imagem') || null;
        return i.editReply('✅ Descrição e imagem salvas!');
    }

    if(i.customId === 'modal_sort_cargos'){
        const ids = i.fields.getTextInputValue('ids');
        sorteioAtual.cargosPermitidos = ids ? ids.split(',').map(id => id.trim()) : [];
        return i.editReply('✅ Cargos salvos!');
    }
});

client.login(process.env.TOKEN);
          
