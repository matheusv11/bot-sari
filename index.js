const puppeteer = require("puppeteer");
const cron      = require('node-cron');

const agendarTicket = async({ login , senha }) => { // OU SÓ MATRICULA, CONTENDO DENTRO LOGIN E SENHA
    // VALIDAR SE TEM SESSÃO
  try {

    // PUPPETEER CONFIG
    const browser = await puppeteer.launch({ headless: false }); //MUDAR PRA PRODUÇÄO
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"
    );
    
    // IR PARA O SARI
    await page.goto("http://www.floriano.ifpi.edu.br:8080/CortexMobileIFPI/login.jsf");

    // REALIZAR LOGIN
    await page.type("#j_username", login);
    await page.type("#j_password", senha);
    await page.click("input[name='j_idt6:j_idt26']");
    
    // VERIFICAR SE HÁ ERRO
    const urlError= await page.url().includes("?erro=true"); //MATCH, SEARCH, INCLUDES

    if(urlError){
        await browser.close()
        throw Error("Login inválido");
    }
    
    //PÁGINA DE TICKETS
    await page.goto("http://www.floriano.ifpi.edu.br:8080/CortexMobileIFPI/modulos/minhaConta/solicitarTickets.jsf");
    
    //VALIDAR DISPONIBILIDADE DE TICKET

    const divTicket= await page.$eval("div[id='j_idt7:tabelaTicketsDaSemanaAVenda:4:j_idt23']", el => el.textContent);
    const totalTicket = divTicket.match('\W*(Qtd. Disponível: [0-9]+)\W*')[0].split(": ")[1]
    
    if(parseInt(totalTicket) <= 0) throw Error("Não há mais ticket disponíveis")

    //AGENDAR TICKET

    await page.click("button[name='j_idt7:tabelaTicketsDaSemanaAVenda:4:j_idt38']");

    throw("Ticket Resgatado");

  } catch (e) {
    console.error("ERROR=>", e);
  }

}

// const cancelarTicket = async() => {

// }


// process.env.APP_LOGIN
agendarTicket({ login: "02272103367", senha: "02267@sari" });


// cron.schedule('0 6 * * *', ()=> sendMessage('dia')   );
// cron.schedule('0 0 * * *', ()=> sendMessage('noite') );