const puppeteer = require('puppeteer');
const knex = require('../db');

module.exports = {
  async scheduleTicket(req, res) {
    const users = await knex('users').select('*');

    // PUPPETEER CONFIG
    chrome.puppeteer.launch({
      args: chrome.args,
      executablePath: await chrome.executablePath,
      headless: chrome.headless
    }).then(async browser => {
      const tipo = 'Jantar' // Temporário

      for await(let user of users) { // Com esse for, ele só vai um por vez // Com Promise.all() Abre tudo de uma vez
        const page = await browser.newPage();

        try {

          await page.setUserAgent(
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"
          );
        
          // IR PARA O SARI
          await page.goto("http://www.floriano.ifpi.edu.br:8080/CortexMobileIFPI/login.jsf");
        
          // REALIZAR LOGIN
          await page.type("#j_username", user.login);
          await page.type("#j_password", user.password);
          await page.click("input[name='j_idt6:j_idt26']");
          await page.waitForTimeout(500);

          // VERIFICAR SE HÁ ERRO
          const urlError= await page.url().includes("?erro=true");

          if(urlError){
              await browser.close()
              throw Error("Login inválido");
          }

          //PÁGINA DE TICKETS
          await page.goto("http://www.floriano.ifpi.edu.br:8080/CortexMobileIFPI/modulos/minhaConta/solicitarTickets.jsf");
          await page.waitForSelector("div[class='ui-panel-m-titlebar ui-bar ui-bar-inherit']");

          // VALIDAR DISPONIBILIDADE DE TICKET
          const ticketId = await page.evaluate(val =>{
            const [...divs] = document.querySelectorAll("div[class='ui-panel-m-titlebar ui-bar ui-bar-inherit']")
        
            return divs.find(e => {
              const [dia, tipo] = e.innerText.split(' - ');
              return dia.includes(new Date().toLocaleDateString('pt-BR')) && tipo === val.tipo
            })?.parentElement.id
        
          }, { tipo: tipo });
          
          if(!ticketId) {
            throw Error("O sistema do sari está fechado ao momento");
          }
        
          const qtdTicket = await page.$eval(`div[id="${ticketId}"] div[class="ui-panel-m-content ui-body ui-body-inherit"] p`, e => e.innerText)
          const totalTicket = qtdTicket.match('\W*(Qtd. Disponível: [0-9]+)\W*')[0].split(": ")[1]
        
          if(parseInt(totalTicket) <= 0) {
            throw Error("Não há mais ticket disponíveis neste horário");
          }
        
          // VALIDAR CAPTCHA
          const divCaptcha = await page.waitForSelector('div#Captcha iframe');
          const frame = await divCaptcha.contentFrame();
          frame.$eval('span[id="recaptcha-anchor"]', e => e.click());
        
          // RESGATAR TICKET
          await page.waitForTimeout(3000);
        
          await page.$eval(`button[id="${ticketId.replace('23', '40')}"]`, e => e.click());
  
          await page.close();
  
        } catch (e) {
          console.error("ERROR=>", e);
          await page.close();
        }
      }

      await browser.close();

    });

    return res.send('Resgate aos tickets iniciada.');

  },

  async retrieveTicket(req, res) {

    const { login, senha, tipo } = req.body;

    // PUPPETEER CONFIG
    puppeteer.launch({
      args: ['--no-sandbox'],
      headless: process.env.NODE_ENV === 'production' ? true : false
    }).then(async browser => {
      try {
        console.log("PUPETEER IS REAL")
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
        await page.waitForTimeout(500);

        // VERIFICAR SE HÁ ERRO
        const urlError= await page.url().includes("?erro=true");
    
        if(urlError){
            await browser.close()
            throw Error("Login inválido");
        }
  
        //PÁGINA DE TICKETS
        await page.goto("http://www.floriano.ifpi.edu.br:8080/CortexMobileIFPI/modulos/minhaConta/solicitarTickets.jsf");
        await page.waitForSelector("div[class='ui-panel-m-titlebar ui-bar ui-bar-inherit']");

        // VALIDAR DISPONIBILIDADE DE TICKET
        const ticketId = await page.evaluate(val =>{
          const [...divs] = document.querySelectorAll("div[class='ui-panel-m-titlebar ui-bar ui-bar-inherit']");

          return divs.find(e => {
            const [dia, tipo] = e.innerText.split(' - ');
            return dia.includes(new Date().toLocaleDateString('pt-BR')) && tipo === val.tipo
          })?.parentElement.id
    
        }, { tipo: tipo });

        if(!ticketId) {
          throw Error("O sistema do sari está fechado ao momento");
        }
  
        const qtdTicket = await page.$eval(`div[id="${ticketId}"] div[class="ui-panel-m-content ui-body ui-body-inherit"] p`, e => e.innerText)
        const totalTicket = qtdTicket.match('\W*(Qtd. Disponível: [0-9]+)\W*')[0].split(": ")[1]
    
        if(parseInt(totalTicket) <= 0) {
          throw Error("Não há mais ticket disponíveis neste horário");
        }
    
        // VALIDAR CAPTCHA
        const divCaptcha = await page.waitForSelector('div#Captcha iframe');
        const frame = await divCaptcha.contentFrame();
        frame.$eval('span[id="recaptcha-anchor"]', e => e.click());
    
        // RESGATAR TICKET
        await page.waitForTimeout(3000);
    
        await page.$eval(`button[id="${ticketId.replace('23', '40')}"]`, e => e.click());
    
        await browser.close();

      } catch (e) {
        console.error("ERROR=>", e);
        await browser.close();
      }
    });

    return res.status(200).send("Ticket Resgatado");
  }

}