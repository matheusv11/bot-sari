const puppeteer = require("puppeteer");
const cron      = require('node-cron');

const agendarTicket = async({ login , senha, tipo }) => { // OU SÓ MATRICULA, CONTENDO DENTRO LOGIN E SENHA
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
    
    // VALIDAR DISPONIBILIDADE DE TICKET
    const ticketId = await page.evaluate(eval =>{
      const [...divs] = document.querySelectorAll("div[class='ui-panel-m-titlebar ui-bar ui-bar-inherit']")

      return divs.find(e => {
        const [dia, tipo] = e.innerText.split(' - ');
        return dia.includes(new Date().toLocaleDateString('pt-BR')) && tipo === eval.tipo
      })?.parentElement.id

    }, { tipo: tipo });

    const qtdTicket = await page.$eval(`div[id="${ticketId}"] div[class="ui-panel-m-content ui-body ui-body-inherit"] p`, e => e.innerText)
    const totalTicket = qtdTicket.match('\W*(Qtd. Disponível: [0-9]+)\W*')[0].split(": ")[1]

    if(!ticketId || parseInt(totalTicket) <= 0) {
      throw Error("Não há mais ticket disponíveis neste horário")
    }

    // VALIDAR CAPTCHA
    const divCaptcha = await page.waitForSelector('div#Captcha iframe');
    const frame = await divCaptcha.contentFrame();
    frame.$eval('span[id="recaptcha-anchor"]', e => e.click());

    // RESGATAR TICKET
    await page.waitForTimeout(3000);

    await page.$eval(`button[id="${ticketId.replace('23', '40')}"]`, e => e.click());

    throw("Ticket Resgatado");

  } catch (e) {
    console.error("ERROR=>", e);
  }

}

// const cancelarTicket = async() => {

// }


// process.env.APP_LOGIN
agendarTicket({ login: "02272103367", senha: "02267@sari", tipo: 'Jantar' });


// cron.schedule('0 6 * * *', ()=> sendMessage('dia')   );
// cron.schedule('0 0 * * *', ()=> sendMessage('noite') );