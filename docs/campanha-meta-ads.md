# Campanha Meta Ads — Corazón Libre · Teste 01 (guia de subida)

Guia campo a campo para subir no Gerenciador de Anúncios (adsmanager.facebook.com).
Estrutura: 1 campanha ABO · 3 conjuntos · 3 anúncios em cada (os mesmos 3).

## ✅ Pré-requisitos (conferir ANTES de subir)

- [ ] Pixel `1527332844902396` instalado nas páginas (já está ✅)
- [ ] Evento **Purchase** configurado na Hotmart (Ferramentas → Pixel de rastreamento → colar o ID)
- [ ] Order bump trocado: audiolibro FORA, Código del Deseo (~$7) no lugar
- [ ] 2 vídeos montados no CapCut (La Espera e La Invisible, 9:16, com narração e legendas)
- [ ] 1 estática do mockup (1080×1080 e/ou 1080×1920)
- [ ] Método de pagamento cadastrado na conta de anúncios
- [ ] Página do Facebook + Instagram da marca conectados (criar uma página "Reconectar" simples se não tiver)

## 1. CAMPANHA

| Campo | Valor |
|---|---|
| Objetivo | **Vendas** |
| Nome | `[CL] Vendas — Teste 01` |
| Categoria de anúncio especial | Nenhuma |
| Orçamento da campanha (Advantage/CBO) | **DESLIGADO** (vamos de ABO — orçamento por conjunto) |
| Teste A/B | Não |

## 2. CONJUNTOS (3× — orçamento no conjunto, $7/dia cada)

Comum aos três:
- Local de conversão: **Site**
- Pixel: `1527332844902396` · Evento: **Compra (Purchase)**
- Orçamento diário: **$7**
- Programação: começar **à meia-noite** do dia seguinte (horário da conta) — dia cheio de dados
- Idade: **30–55** · Gênero: **Mulheres**
- Idiomas: **Espanhol (todos)**
- Posicionamentos: **Advantage+ (automáticos)**

| Conjunto | Nome | Países | Direcionamento detalhado |
|---|---|---|---|
| 1 | `[CL] Broad LATAM — M30-55 ES` | México, Colômbia, Argentina, Peru, Equador, Chile | **vazio** (broad — o criativo segmenta) |
| 2 | `[CL] Interesses — M30-55 ES` | os mesmos 6 países | Interesses (todos juntos no mesmo campo): Autoayuda · Desarrollo personal · Inteligencia emocional · Meditación · Amor |
| 3 | `[CL] Broad MX+CO — M30-55 ES` | só México e Colômbia | vazio (broad) |

## 3. ANÚNCIOS (os mesmos 3 dentro de cada conjunto)

Comum aos três anúncios:
- Site: `https://app.clubdigital.site/corazon-libre.html` (+ UTM abaixo)
- Botão (CTA): **Saber más**
- Descrição: `Acceso inmediato · Garantía de 7 días`

### AD 1 — Vídeo "La Espera"
- Nome: `AD1 — video espera`
- URL com UTM: `https://app.clubdigital.site/corazon-libre.html?utm_source=fb&utm_medium=paid&utm_campaign=cl-teste01&utm_content=video-espera`
- Título: `Sanar también se aprende, paso a paso`
- Texto principal:

```
Ella también revisaba el celular cada cinco minutos.
También decía "está bien" cuando nada estaba bien.
También se preguntaba qué había hecho mal... otra vez.

Hasta que entendió algo que nadie le había dicho:
no era mala suerte. Era un patrón. Y los patrones se pueden desaprender.

Hoy existe un proceso guiado, paso a paso, para dejar de rogar amor
y empezar a recibirlo — desde tu celular, a tu ritmo.

Toca en "Saber más" y descubre cómo empezar hoy 💗
```

### AD 2 — Vídeo "La Invisible"
- Nome: `AD2 — video invisible`
- URL com UTM: `...&utm_content=video-invisible` (resto igual)
- Título: `Volver a ti también es un proceso`
- Texto principal:

```
Cuida de todos. Resuelve todo. Aguanta todo.
¿Y de ella? ¿Quién cuida de ella?

Hay mujeres que llevan tanto tiempo dando amor
que se olvidaron de guardarse un poco.

La buena noticia: volver a ti no es egoísmo — y tampoco es un misterio.
Es un proceso guiado, paso a paso, desde tu celular.

Toca en "Saber más" y date los primeros 10 minutos que son solo tuyos 💗
```

### AD 3 — Estática (mockup do livro)
- Nome: `AD3 — estatica mockup`
- URL com UTM: `...&utm_content=estatica-mockup` (resto igual)
- Título: `El proceso de 4 fases para volver a ti`
- Texto principal:

```
Los libros explican. Pero explicar no es sanar.

Por eso esto no es "un libro más": es un proceso guiado en 4 fases
— con audio, ejercicios y diario — para soltar los patrones
que te hacen rogar amor, y atraer el que sí mereces.

Paso a paso. A tu ritmo. Desde tu celular.

Toca en "Saber más" 💗
```

## 4. Regras de operação (mexer só 1× por dia, de manhã)

| Situação | Ação |
|---|---|
| Primeiras 24-48 h | NÃO MEXER EM NADA (aprendizado) |
| Anúncio com CTR < 1% após ~$10 gastos | Desligar o anúncio |
| Conjunto gastou $25 sem nenhuma venda | Desligar o conjunto |
| Muitos cliques e zero InitiateCheckout | Problema na página → falar com o Claude |
| Venda com CPA < $9.90 | Vencedor: +20-30% no orçamento a cada 48 h (nunca dobrar em 1 dia) |
| Anúncio vencedor cansou (CPA subindo 3 dias) | Não reanimar: subir criativo novo |

Meta da fase de teste: 1 combinação com **CPA ≤ $8** → depois escalar e criar campanha de remarketing.

## 5. Avisos de política do Meta (evitar reprovação)

- Nunca usar "tú estás rota/deprimida/ansiosa" em texto de anúncio (atributo pessoal) — por isso as copies falam de "ella" (terceira pessoa)
- Se um anúncio for reprovado: pedir revisão (erro comum do robô) e, se mantiver, trocar a frase sinalizada
- Não prometer cura/resultado garantido de saúde
