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

    //AGENDAR TICKET
    await page.goto("http://www.floriano.ifpi.edu.br:8080/CortexMobileIFPI/modulos/minhaConta/solicitarTickets.jsf");

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