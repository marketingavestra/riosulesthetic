# Rio Sul Esthetic

Site estático editável, em português, com página de links (`/`) e página completa (`/site/`). HTML, CSS e JavaScript sem dependências de aplicação ou etapa de compilação.

## Conteúdo e recursos

- Identidade Rio Sul Esthetic, links de WhatsApp, Instagram e localização em Santa Maria, RS.
- Fundo em vídeo V2 com reprodução silenciosa, imagem de fallback e controle de pausa. Respeita movimento reduzido e pausa em abas ocultas.
- Botões translúcidos e animação de WhatsApp: interação com mouse no desktop e intervalo de 8 segundos em dispositivos de toque. O movimento é suspenso quando o botão está fora da tela, a aba está oculta ou há preferência por movimento reduzido.
- Página completa com contadores, perguntas frequentes e seis cartões de feedback explicitamente ilustrativos.

## Arquivos para editar

- `dist/index.html`: página de links, contatos, localização e metadados de compartilhamento.
- `dist/site/index.html`: conteúdo da página completa, métricas e perguntas frequentes.
- `dist/home.js` e `dist/site/clinic.js`: interações de cada página.
- `dist/assets/background.css` e `background.js`: fundo e estilos compartilhados.
- `dist/assets/whatsapp-motion.js`: movimento dos botões de WhatsApp.
- `dist/assets/index-CbPjQQ4H.css`: classes utilitárias já geradas. Classes novas não geram CSS automaticamente; acrescente estilos manualmente.
- `dist/assets/`: somente as mídias utilizadas, incluindo vídeo/poster V2, logos Rio Sul e ícones sociais/localização.

Edite os textos nos HTMLs e os destinos em `href`. O contato atual usa `https://wa.me/message/CLLCSPVDWHQMJ1`; procure esse endereço nas duas páginas para alterá-lo. Ao mudar o endereço físico, atualize também o mapa incorporado e o link de localização. Para substituir uma mídia, mantenha o nome do arquivo ou atualize todas as suas referências.

## Visualizar localmente

Na raiz do projeto, execute com Python 3 instalado:

```sh
python3 -m http.server 8000 --directory dist
```

Abra `http://localhost:8000/` e `http://localhost:8000/site/`. Use um servidor HTTP, pois os caminhos dos arquivos começam em `/`; abrir o HTML por `file://` não é suportado.

## Testes

Com Python 3 e Node.js 18 ou superior:

```sh
python3 tests/check_site.py
node --test tests/whatsapp-motion.test.js
```

Os testes verificam conteúdo, referências locais e comportamento do movimento em ambiente simulado. Não substituem a revisão visual em navegadores ou a conferência dos serviços externos.

## Publicar

Publique somente o conteúdo de `dist` na raiz de uma hospedagem estática. O projeto inclui `vercel.json` com `dist` como diretório de saída, sem instalação de dependências ou build. Na Vercel, importe o repositório como projeto estático/Other e mantenha essa configuração. Para outra hospedagem, configure a pasta de publicação como `dist` e o acesso a `site/index.html` em `/site/`.

Os caminhos absolutos pressupõem publicação na raiz do domínio. Para hospedar em uma subpasta, adapte os caminhos antes de publicar. Mapa, Instagram e WhatsApp dependem de conexão e dos serviços externos.

## Revisões editoriais antes de publicar

- Os seis feedbacks e suas estrelas são exemplos ilustrativos, não avaliações verificadas. Substitua por depoimentos reais autorizados ou remova a seção.
- As métricas de 10 mil clientes e mais de 2 anos foram fornecidas pelo responsável, sem verificação independente. O indicador de 98% de satisfação também não possui comprovação neste projeto. Valide as métricas e demais alegações comerciais antes da divulgação.
- Os links de Política de Privacidade e Termos de Uso são marcadores `#`. É necessário fornecer os documentos e seus destinos reais.
- Confira textos de serviços, contatos, créditos, direitos de uso das mídias e metadados antes de publicar.

Esta exportação contém os arquivos editáveis atuais e seus testes. Não inclui histórico Git anterior, credenciais, configurações privadas de hospedagem, cópias de produção antigas ou mídias sem uso. Nenhuma publicação é realizada pelos comandos de visualização ou testes acima.
