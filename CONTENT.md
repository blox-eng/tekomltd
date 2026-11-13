# Как да променяте сайта / How to change the site

Български: [по-долу](#български) · English: [below](#english)

---

# Български

Всичко, което се вижда на сайта (текстове, проекти, снимки, PDF-и), е в папката `content/`. Не е нужно да пишете код. Променяте файл в GitHub, предлагате промяната („pull request“), гледате как изглежда на тестов адрес и разработчикът я публикува.

## Как работи промяната (общо)

1. Отворете файла в GitHub и натиснете молива **Edit** (или **Add file → Upload files** за снимки и PDF).
2. Направете промяната.
3. Натиснете **Commit changes…**, изберете **Create a new branch for this commit and start a pull request**, после **Propose changes** и **Create pull request**.
4. След 1-2 минути в pull request-а се появява коментар от Netlify с връзка **Deploy Preview**. Отворете я: това е сайтът с Вашата промяна. Проверете страниците, и на телефон.
5. Ако всичко е наред, кажете на разработчика. Той натиска **Merge** и промяната отива на живо. Ако нещо не е наред, редактирайте отново в същия pull request: прегледът се обновява сам.

Нищо не се публикува, докато разработчикът не натисне Merge.

## Червеният ✗ (проверката `content:check`)

Под pull request-а има списък „Checks“. Зелено ✓ значи, че файловете са наред. Червено ✗ значи, че има грешка: отворете **Details** на проверката `check` и вижте реда с грешката. Всеки ред е във вида:

```
файл: поле съобщение
```

Например (пътят е спрямо папката `content`):

```
projects/kazanlak-house/project.yaml: images.0.file file not found: kazanlak-1.jpg
```

Четете го така: във файла `project.yaml` на проекта `kazanlak-house`, в първата снимка от списъка `images` (`images.0.file`), пише „файлът не е намерен: kazanlak-1.jpg“. Значи снимката не е качена в папката на проекта или името ѝ е различно. Оправете точно това и запазете. Проверката тръгва пак сама.

Най-честите грешки:

- `file not found: ...` — името на снимката във файла не съвпада с качения файл (главни/малки букви, разширение `.jpg`).
- `slug "..." must match its folder` — полето `slug` трябва да е същото като името на папката.
- `images.N.focus Invalid option` — `focus` е само една от думите `center`, `top`, `bottom`, `left`, `right`, с малки букви.
- `use lowercase letters, digits and single hyphens` — в `slug` само малки латински букви, цифри и тирета: `nova-kashta`.
- `cannot read YAML` — объркан отстъп или липсващи кавички (вижте „Правила за YAML“).
- `wp_id ... is already used by ...` или `wp_slug ... is already used by ...` — редът е копиран от друг проект. В нов проект изтрийте реда.
- `... is outside Bulgaria` — координатите `lat`/`lng` са сгрешени или разменени (вижте „Нов проект“).
- `image must be a file under /media/` — снимка в страница сочи към друг сайт или към грешен път. Качете снимката в `content/` и я пишете с `/media/…` (вижте „Смяна на текст“).
- `file not found: the old address ... leads here` — файл, към който води адрес от стария сайт, е преименуван или изтрит. Върнете го със същото име или питайте разработчика.
- `date ... is in the future; write the day it happened` — дата на етап е след днес. Пишете деня, в който се е случило.
- `done ... is before started ...` — датите на етапа са разменени.
- `remove year until progress.status is done` — проект в строеж още няма година. Махнете `year`.
- `a finished project needs year` / `a finished project needs a done date on every stage` / `a finished project lists its stages, each with a done date` — при `status: done` добавете `year` и дата `done` на всеки етап.
- `name must be YYYY-MM-DD.bg.md` — файл в `updates` е с грешно име. Пример: `2026-11-20.bg.md`.
- `... is not a real past or present date` — датата в името на актуализацията не съществува или е след днес.
- `add ....bg.md first; the Bulgarian text is required` — има превод без български файл със същата дата.
- `photos go in the .bg.md file` — снимки са записани в `.en.md` или `.de.md`. Преместете ги в `.bg.md`.
- `updates need a progress block in project.yaml` — има папка `updates`, но в `project.yaml` няма блок `progress`.
- `warning: ... newest update is N days old` — само предупреждение: време е за нова актуализация.
- `Unrecognized key: "price"` — в обект има цена. Цени не се пишат; изтрийте реда.
- `remove the DXF/DWG file from content/` — качен е чертеж. Изтрийте го; качва се само планът от `pnpm blueprint`.
- `plans/N.svg is missing; make it with pnpm blueprint` — етаж в `sales.floors` няма план.
- `outline 12 has no units/12.yaml` / `unit 12 has no outline on plans/N.svg` — кодовете в плана и в `units/` не съвпадат.
- `floor N is not in sales.floors of project.yaml` — обектът е на етаж, който сградата няма.
- `the areas go net ≤ built ≤ total` — площите в `area` са разменени.
- `a flat has rooms; …` — `rooms` е само при `type: flat` и там е задължително.
- `name the file N.yaml, after its code` / `units A3 and a3 share the address` — името на файла не е кодът, или два кода се различават само по главни и малки букви.
- `the button goes to a page of this site (/…) or to mailto:` — `cta.href` сочи към друг сайт.
- `the project is a draft; publish it or remove home` / `home and cta go in the .bg.md file` — `home` е на чернова или в превод.
- `warning: ... availability is N days old` — само предупреждение: проверете статусите и сменете `updated`.

## Правила за YAML (важно)

- **Отстъпите са интервали**, не табулатор. Две интервала на ниво. Не променяйте отстъпите на съседните редове.
- **Телефони, ЕИК и други номера: в кавички.** Пишете `phone: "+359 88 863 6034"` и `eik: "123456789"`. Без кавички YAML може да изяде нула отпред или да го прочете като число.
- Текст с двоеточие, кавичка в началото или `#` също слагайте в кавички: `bg: "Теком: строителство"`.
- Български текст е задължителен (`bg`). Английски (`en`) и немски (`de`) са по желание.
- Не пипайте името на полето (`title`, `place`, `images`). Променяйте само текста след двоеточието.

## 1. Нов проект

Пример: нов проект „Къща в Казанлък“.

1. В GitHub отворете `content/projects/`, натиснете **Add file → Create new file** и в полето за име напишете `kazanlak-house/project.yaml`. (Наклонената черта създава папката.) Името на папката е само малки латински букви, цифри и тирета.
2. Поставете този блок и го променете. Не копирайте `project.yaml` на друг проект: той носи редове, които важат само за него.
3. Ако искате, добавете още полета от списъка под блока.

```yaml
slug: kazanlak-house
title:
  bg: Къща в Казанлък
place:
  bg: Казанлък
year: 2026
scopes:
  - full
images:
  - file: kazanlak-1.jpg
    is_cover: true
  - file: kazanlak-2.jpg
draft: true
```

`slug` е същото като името на папката. `scopes` е едно или повече от: `full` (ново строителство), `restore` (реставрация), `facade` (фасада), `interior` (интериор), `stone` (камък).

Полета по желание (на най-горното ниво, без отстъп):

- `on_rail` — проектът е в лентата с проекти на началната страница. Така е по подразбиране; за да не е там, напишете `on_rail: false`.
- `sort` — място в списъка: `sort: 1` е първи. Проектите без `sort` идват след номерираните, по-новите (`year`) първи.
- `show_on_map: true` заедно с `lat` и `lng` — точка на картата на началната страница. Координатите: в Google Maps десен бутон върху мястото, първото число е `lat`, второто `lng`. Пишат се и двете или нито едно. В България `lat` е между 41 и 44,5, а `lng` между 22 и 29.
- `built_area_m2` — разгъната застроена площ в м², само числото.
- `wp_id`, `wp_slug` — само за проектите, пренесени от стария сайт. В нов проект не ги пишете.

4. Качете снимките в **същата папка**: отворете `content/projects/kazanlak-house/` → **Add file → Upload files**. Имената трябва да съвпадат с тези в `images`.
5. **Първата снимка в списъка `images` е заглавната (cover).** Редът в списъка е редът на сайта.

   Снимките в списъка с проекти и в галерията се показват като квадрати: сайтът изрязва краищата. Ако изрязването отрязва важната част, добавете към снимката `focus` — коя част да остане: `top` (горе), `bottom` (долу), `left` (ляво), `right` (дясно) или `center` (среда, по подразбиране). Цялата снимка се отваря с клик върху квадрата.

   ```yaml
   images:
     - file: kazanlak-1.jpg
       is_cover: true
     - file: kazanlak-2.jpg
       focus: top
   ```

   Когато някой сподели линка на проекта (Viber, WhatsApp, Facebook), се показва заглавната снимка, изрязана широко, със същия `focus`. За друга снимка там добавете в `project.yaml` ред `og_image: kazanlak-3.jpg`. Снимката за началната и останалите страници е първият проект в слайдера или `og_image` в `content/settings.yaml`.

6. Докато проектът не е готов, оставете `draft: true`: проектът не се вижда. Когато е готов, изтрийте реда `draft: true` (или напишете `draft: false`).

Съвет: снимките до около 2 MB, поне 1600 px по-дългата страна, формат `.jpg`.

## 2. Смяна на текст

Пример: нов работен час. Отворете `content/settings.yaml`, натиснете молива и променете:

```yaml
hours:
  bg: Пон – Пет, 9.00 – 18.00
```

Текстовете на страниците са в `content/pages/` (например `about.bg.md`). Това са обикновен текст със заглавия, започващи с `##`. Първите редове между `---` (заглавие, дата) не се пипат, освен ако не искате да сменяте заглавието.

Снимка в страница: качете я в `content/pages/<страница>/` (например `content/pages/about/ekip.jpg`) и я пишете с `/media/` отпред: `![Екипът на обекта](/media/pages/about/ekip.jpg)`. Снимки от други сайтове не се приемат: сайтът не зарежда нищо от чужди адреси. Обикновена връзка към друг сайт (`[текст](https://...)`) е позволена.

## 3. Превод на английски или немски

Всяко текстово поле има `bg` и по желание `en` и `de`. Добавете ред със същия отстъп:

```yaml
title:
  bg: Къща в Казанлък
  en: House in Kazanlak
  de: Haus in Kasanlak
```

За страниците (`content/pages/`) и правните текстове (`content/legal/`) се прави отделен файл: до `about.bg.md` добавете `about.en.md` (или `about.de.md`) със същата първа част между `---` и преведен текст. Без превод сайтът показва българския текст с бележка „Превод предстои“.

## 4. Скриване и показване на проект

Отворете `content/projects/<папка>/project.yaml`.

- За да скриете: добавете ред `draft: true` (на най-горното ниво, без отстъп).
- За да покажете: изтрийте реда или напишете `draft: false`.

Проектът остава във файловете, само не се вижда на сайта.

## 5. Публикация (PDF)

Пример: нова публична покана.

1. Качете PDF в `content/publications/`: **Add file → Upload files**. Името е само латински букви, цифри и тирета, например `2026-10-pokana.pdf`.
2. Отворете `content/publications.yaml`, натиснете молива и добавете ред в края на списъка (внимавайте за отстъпа):

```yaml
- programme: BG05SFPR002-1.004-1772-C01
  kind: procurement
  title:
    bg: Публична покана
  file: publications/2026-10-pokana.pdf
  published_on: 2026-10-15
```

`kind` е `eu_notice`, `procurement` или `other`. `programme` е кодът от `content/eu-programmes.yaml` (може да се пропусне). `published_on` е във вида `ГГГГ-ММ-ДД`.

## 6. Нов партньор

1. Качете логото (`.png` или `.svg`) в `content/partners/`: **Add file → Upload files** (папката се създава сама, ако напишете `partners/` в името).
2. В `content/home.yaml` намерете реда `partners: []` в края. Сменете го така:

```yaml
partners:
  - name: Име на фирмата
    role:
      bg: Архитектурно проектиране
    logo: partners/ime-na-firmata.png
    url: https://primer.bg
```

Следващ партньор: още един блок, започващ с `-`, със същия отстъп. `url` е по желание.

Пишете само имена на партньори, които са се съгласили.

## 7. Контактни данни

Всичко е в `content/settings.yaml`: адрес (`address`), телефон (`phone`), час на работа (`hours`), имейл (`email`).

```yaml
phone: '+359 88 863 6034'
email: info@tekomltd.com
```

Телефонът и ЕИК (`eik`) са в кавички.

## 8. Проект в строеж

Обект, по който работим сега: собствена сграда, къща на клиент или фасада. Сайтът показва етапите, кога очакваме да свършим и дневник с актуализации. Когато работата свърши, проектът става обикновен завършен проект и пази дневника си.

### Започване

Направете проекта както в „1. Нов проект“, но **без** `year`. Добавете най-отдолу блок `progress` за вида обект. Копирайте целия блок: етапите са готови, без дати.

Нова жилищна сграда (`building`):

```yaml
progress:
  status: in_progress
  kind: building
  expected: 2028-Q1
  stages:
    - key: design
    - key: permit
    - key: excavation
    - key: zero
    - key: act14
    - key: act15
    - key: act16
```

Къща (`house`):

```yaml
progress:
  status: in_progress
  kind: house
  stages:
    - key: design
    - key: permit
    - key: zero
    - key: rough
    - key: roof
    - key: finishing
    - key: use_permit
```

Фасада (`facade`):

```yaml
progress:
  status: in_progress
  kind: facade
  stages:
    - key: scaffold
    - key: insulation
    - key: render
    - key: scaffold_down
    - key: handover
```

- `expected` е тримесечието, в което очакваме да свършим: `2028-Q1` … `2028-Q4`. Не е задължително. Сайтът никога не показва ден.
- `permit: "РС № 12/2026, Община Стара Загора"` показва разрешението за строеж. Не е задължително.
- `note: { bg: Сроковете се преразглеждат. }` е кратка бележка за посетителя, например когато работата спре или срокът се мести. Махнете я, когато вече не важи.
- Свой етап, който го няма в списъка: вместо `key` пишете `label`, например `- label: { bg: Археологически проучвания }`. Сложете го на мястото му в реда.
- Местоположението е каквото Вие запишете. За частна къща пишете само селото или района в `place` и не пишете `address`, `lat`, `lng` и `show_on_map`.
- Никога не пишете цени, суми, името на възложителя, ЕИК или лични имена.

### Етап започна, етап свърши

Добавете дата под етапа (`ГГГГ-ММ-ДД`, денят, в който се е случило):

```yaml
    - key: act14
      started: 2027-03-01
      done: 2027-09-15
```

Етап само със `started` е „в ход“. С `done` е завършен. Няколко етапа могат да са в ход едновременно.

### Нова актуализация

Актуализациите са в папка `updates` в папката на проекта. Всяка е един файл с името на датата: `updates/2026-11-20.bg.md`.

- В GitHub: **Add file → Create new file**, името е `updates/2026-11-20.bg.md`. Поставете шаблона по-долу.
- На компютър: `pnpm new-update stoletov-46` прави файла с днешна дата и шаблона.

```markdown
---
photos:
  - file: 2026-11-20-1.jpg
    alt: Покривът е готов
---

**Направено:** покривът и комините.

**Следва:** дограмата.
```

Снимките се качват в същата папка `updates` (**Add file → Upload files**). Без снимки пишете `photos: []`. Превод: файл със същата дата и `.en.md` или `.de.md`, само с текст. Снимките са само в `.bg.md`.

Пишете поне веднъж на месец. Ако последната актуализация е по-стара от 45 дни, проверката показва предупреждение (`warning: ... newest update is N days old`). Сайтът се публикува, но посетителят вижда старата дата.

### Край

Когато обектът е предаден: `status: done`, добавете `year: 2027` в горната част и дата `done` на всеки етап. Етикетът „в строеж“ изчезва, проектът показва колко години стои и дневникът остава.

## 9. Сграда в продажба

Сграда, в която продаваме апартаменти, гаражи, паркоместа, складове или магазини. Сайтът показва колко обекта има и колко са свободни, етажите като чертеж, план на всеки етаж и отделна страница за всеки обект с бутон за запитване по имейл. **Цени никога не се пишат**: файловете са публични. Проверката спира всеки ред `price:`.

### Подготовка на чертежа (веднъж за всеки етаж)

Архитектът дава DXF. В него няма контури на апартаментите, затова някой (архитектът или ние) добавя **един нов слой** с името `TEKOM_UNIT`:

- За всеки обект: един **затворен** полилайн (polyline) по външните стени на обекта.
- Вътре в контура: един текст с кода на обекта: `12`, `A3`, `G1`. Само латински букви, цифри и тире.
- Нищо друго на този слой.

```
┌───────────┬────────┬─────┐   слой TEKOM_UNIT:
│           │        │     │   ┌──────┐
│    12     │   13   │ A3  │   │  12  │  ← затворен контур + код вътре
│           │        │     │   └──────┘
└───────────┴────────┴─────┘
```

DXF файлът **не се качва** в сайта: в него има размери, конструкция, инсталации и имена. Проверката спира всеки `.dxf` или `.dwg` в `content/`.

### Етаж от DXF към сайта

На компютър, от папката на сайта:

```
pnpm blueprint <проект> <етаж> път/до/етаж-4.dxf
```

Например `pnpm blueprint novata-sgrada 4 ~/Desktop/etazh-4.dxf`. Етажът се пише с латиница и цифри: `-1`, `0`, `4`, `penthouse`.

Командата:

- взима стените и контурите и пропуска размери, текст, щриховки и мебели;
- пише `plans/4.svg` в папката на проекта;
- за всеки нов обект пише `units/<код>.yaml` с измерената застроена площ. Съществуващ файл не се пипа; ако площта в чертежа е различна с над 2 %, командата го казва.

Тя казва и мерната единица на чертежа: `мерна единица: mm (предположение…)`. Ако е грешно, пуснете я пак с `--units cm` или `--units m`.

Ако линии има на повече от един слой (мебели, инсталации, рамка), командата спира и изброява слоевете. Посочете само стените: `--walls "Стени"`, или няколко слоя: `--walls "Стени,Колони"`. Така мебели и инсталации не стигат до сайта.

Ако има грешка, командата не пише нищо и казва къде е: `Контур без код при (15, 7.38) m: добави текст с кода в контура на слой TEKOM_UNIT`.

### Блокът `sales` в `project.yaml`

```yaml
sales:
  view: switch          # switch — малка сграда: етажът се избира отляво; scroll — голяма сграда: всички етажи един под друг
  # email: sales@tekomltd.com   # по желание; иначе е имейлът от settings.yaml
  floors:               # отдолу нагоре
    - key: '-1'
      label: { bg: Сутерен, en: Basement }
    - key: '0'
      label: { bg: Партер, en: Ground floor }
    - key: '1'
    - key: '2'
  updated: 2026-11-20   # денят, в който проверихте статусите
```

Всеки етаж в `floors` трябва да има `plans/<key>.svg`.

### Един обект: `units/12.yaml`

```yaml
code: '12'
type: flat            # flat, garage, parking, storage или shop
floors: ['4']         # мезонет: ['4', '5']
rooms: 3              # само за flat
area:
  total: 88           # обща площ, с общите части
  built: 81.6         # застроена; командата я мери от чертежа
  net: 72             # чиста площ
terrace: 9.5          # по желание
orientation: [S, W]   # N NE E SE S SW W NW
status: free          # free, reserved, upcoming или sold
note: { bg: Ъглов апартамент с две тераси. }   # по желание
```

Площите вървят чиста ≤ застроена ≤ обща. Кодът и името на файла са същите: `12` → `12.yaml`.

### Смяна на статус

Отворете `units/12.yaml`, сменете `status` и сменете `updated` в `project.yaml` на днешната дата. Всичко останало (броят свободни, етажите, страницата на обекта) се смята само.

| Статус | Сайтът показва | Бутон |
|---|---|---|
| `free` | свободен | „Попитай за Ап. 12“ |
| `reserved` | резервиран | „Попитай дали се освобождава“ |
| `upcoming` | предстои | „Запиши интерес“ |
| `sold` | продаден | без бутон, връзка към свободните |

Бутонът отваря пощата на купувача с готова тема: `Запитване: <сграда> · Ап. 12, ет. 4`. Ако `updated` е по-стар от 45 дни, проверката показва предупреждение: проверете статусите.

### Новина на началната страница

Всяка актуализация (вижте „8. Проект в строеж“) може да излезе на началната страница. В горната част на `.bg.md` файла добавете:

```yaml
home: true
cta:                                   # бутон, по желание
  label: { bg: Свободни апартаменти, en: Available flats }
  href: /projects/novata-sgrada#apartamenti   # страница от сайта или mailto:
```

Началната страница показва най-новата актуализация с `home: true`. За да я махнете, изтрийте реда `home: true`.

## Преди да изпратите

Всеки pull request има малък списък (шаблон): прегледан ли е Deploy Preview, зелена ли е проверката, как изглеждат снимките на телефон. Отметнете го честно.

---

# English

Everything visible on the site (texts, projects, photos, PDFs) lives in the `content/` folder. You do not write code. You change a file on GitHub, propose the change (a "pull request"), look at it on a test address, and a developer publishes it.

## How a change works

1. Open the file on GitHub and click the pencil **Edit** (or **Add file → Upload files** for photos and PDFs).
2. Make the change.
3. Click **Commit changes…**, choose **Create a new branch for this commit and start a pull request**, then **Propose changes** and **Create pull request**.
4. After 1-2 minutes Netlify posts a comment in the pull request with a **Deploy Preview** link. Open it: it is the site with your change. Check the pages, on a phone too.
5. If it is right, tell the developer. They click **Merge** and the change goes live. If not, edit again in the same pull request: the preview updates by itself.

Nothing is published until a developer clicks Merge.

## The red ✗ (the `content:check` check)

Under the pull request you see a "Checks" list. A green ✓ means the files are valid. A red ✗ means there is an error: open **Details** of the `check` job and find the error line. Each line looks like:

```
file: field message
```

For example (the path is relative to the `content` folder):

```
projects/kazanlak-house/project.yaml: images.0.file file not found: kazanlak-1.jpg
```

Read it as: in `project.yaml` of project `kazanlak-house`, the first photo in the `images` list (`images.0.file`), "file not found: kazanlak-1.jpg". So the photo is not uploaded to the project folder, or its name differs. Fix exactly that and save. The check runs again by itself.

Common errors:

- `file not found: ...` — the photo name in the file does not match the uploaded file (upper/lower case, `.jpg` extension).
- `slug "..." must match its folder` — the `slug` field must equal the folder name.
- `images.N.focus Invalid option` — `focus` is only one of `center`, `top`, `bottom`, `left`, `right`, in lowercase.
- `use lowercase letters, digits and single hyphens` — `slug` uses only lowercase Latin letters, digits and hyphens: `nova-kashta`.
- `cannot read YAML` — wrong indentation or missing quotes (see "YAML rules").
- `wp_id ... is already used by ...` or `wp_slug ... is already used by ...` — the line was copied from another project. Delete it in a new project.
- `... is outside Bulgaria` — `lat`/`lng` are wrong or swapped (see "Add a project").
- `image must be a file under /media/` — an image in a page points at another site or a wrong path. Upload the image into `content/` and write it with `/media/…` (see "Change a text").
- `file not found: the old address ... leads here` — a file that an address of the old site leads to was renamed or deleted. Put it back under the same name, or ask the developer.
- `date ... is in the future; write the day it happened` — a stage date is after today. Write the day it happened.
- `done ... is before started ...` — the stage dates are swapped.
- `remove year until progress.status is done` — a project in progress has no year yet. Remove `year`.
- `a finished project needs year` / `... a done date on every stage` / `... lists its stages, each with a done date` — with `status: done`, add `year` and a `done` date on every stage.
- `name must be YYYY-MM-DD.bg.md` — a file in `updates` has a wrong name. Example: `2026-11-20.bg.md`.
- `... is not a real past or present date` — the date in the update's name does not exist or is after today.
- `add ....bg.md first; the Bulgarian text is required` — a translation has no Bulgarian file of the same date.
- `photos go in the .bg.md file` — photos are listed in `.en.md` or `.de.md`. Move them to `.bg.md`.
- `updates need a progress block in project.yaml` — there is an `updates` folder but no `progress` block.
- `warning: ... newest update is N days old` — only a warning: time for a new update.
- `Unrecognized key: "price"` — a unit has a price. Prices are never written; delete the line.
- `remove the DXF/DWG file from content/` — a drawing was committed. Delete it; only the plan from `pnpm blueprint` goes in.
- `plans/N.svg is missing; make it with pnpm blueprint` — a floor in `sales.floors` has no plan.
- `outline 12 has no units/12.yaml` / `unit 12 has no outline on plans/N.svg` — the codes in the plan and in `units/` differ.
- `floor N is not in sales.floors of project.yaml` — the unit is on a floor the building does not list.
- `the areas go net ≤ built ≤ total` — the areas are swapped.
- `a flat has rooms; …` — `rooms` belongs to `type: flat` only, and a flat needs it.
- `name the file N.yaml, after its code` / `units A3 and a3 share the address` — the file name is not the code, or two codes differ only in case.
- `the button goes to a page of this site (/…) or to mailto:` — `cta.href` points at another site.
- `the project is a draft; publish it or remove home` / `home and cta go in the .bg.md file` — `home` is on a draft or in a translation.
- `warning: ... availability is N days old` — only a warning: check the statuses and update `updated`.

## YAML rules (important)

- **Indent with spaces**, never tabs. Two spaces per level. Do not change the indentation of neighbouring lines.
- **Phone numbers, company IDs (EIK) and other numbers: in quotes.** Write `phone: "+359 88 863 6034"` and `eik: "123456789"`. Without quotes YAML can drop a leading zero or read it as a number.
- Put text that contains a colon, starts with a quote or contains `#` in quotes too: `bg: "Теком: строителство"`.
- Bulgarian (`bg`) is required. English (`en`) and German (`de`) are optional.
- Never rename a field (`title`, `place`, `images`). Change only the text after the colon.

## 1. Add a project

Example: a new project "House in Kazanlak".

1. On GitHub open `content/projects/`, click **Add file → Create new file** and type `kazanlak-house/project.yaml` as the name. (The slash creates the folder.) The folder name uses only lowercase Latin letters, digits and hyphens.
2. Paste this block and edit it. Do not copy another project's `project.yaml`: it carries lines that belong to that project only.
3. If you like, add more fields from the list below the block.

```yaml
slug: kazanlak-house
title:
  bg: Къща в Казанлък
  en: House in Kazanlak
place:
  bg: Казанлък
  en: Kazanlak
year: 2026
scopes:
  - full
images:
  - file: kazanlak-1.jpg
    is_cover: true
  - file: kazanlak-2.jpg
draft: true
```

`slug` equals the folder name. `scopes` is one or more of: `full` (new build), `restore`, `facade`, `interior`, `stone`.

Optional fields (top level, no indentation):

- `on_rail` — the project is in the project rail on the home page. That is the default; to leave it out, write `on_rail: false`.
- `sort` — place in the list: `sort: 1` comes first. Projects without `sort` follow the numbered ones, newest `year` first.
- `show_on_map: true` together with `lat` and `lng` — a pin on the home page map. To get the numbers: in Google Maps right-click the place; the first number is `lat`, the second `lng`. Write both or neither. In Bulgaria `lat` is between 41 and 44.5 and `lng` between 22 and 29.
- `built_area_m2` — built area in m², the number only.
- `wp_id`, `wp_slug` — only for projects carried over from the old site. Never write them in a new project.

4. Upload the photos into the **same folder**: open `content/projects/kazanlak-house/` → **Add file → Upload files**. The names must match the ones in `images`.
5. **The first photo in `images` is the cover.** The list order is the order on the site.

   Photos in the project list and the gallery show as squares: the site crops the edges. If the crop cuts off the important part, add `focus` to the photo, the part to keep: `top`, `bottom`, `left`, `right` or `center` (the default). A click on the square opens the whole photo.

   ```yaml
   images:
     - file: kazanlak-1.jpg
       is_cover: true
     - file: kazanlak-2.jpg
       focus: top
   ```

   When someone shares the project link (Viber, WhatsApp, Facebook), the preview shows the cover, cropped wide, with the same `focus`. To show another photo there, add `og_image: kazanlak-3.jpg` to `project.yaml`. The home page and the other pages show the first project on the rail, or `og_image` in `content/settings.yaml`.

6. While the project is not ready keep `draft: true`: it stays hidden. When ready, delete the line (or write `draft: false`).

Tip: photos up to about 2 MB, at least 1600 px on the long side, `.jpg`.

## 2. Change a text

Example: new opening hours. Open `content/settings.yaml`, click the pencil and change:

```yaml
hours:
  bg: Пон – Пет, 9.00 – 18.00
  en: Mon–Fri 9:00–18:00
```

Page texts are in `content/pages/` (for example `about.bg.md`): plain text with headings that start with `##`. Leave the lines between the first `---` marks (title, date) alone unless you want to change the title.

An image in a page: upload it to `content/pages/<page>/` (for example `content/pages/about/crew.jpg`) and write it with `/media/` in front: `![The crew on site](/media/pages/about/crew.jpg)`. Images from other sites are rejected: the site loads nothing from other addresses. A plain link to another site (`[text](https://...)`) is fine.

## 3. Add an English or German translation

Every text field has `bg` and optional `en` and `de`. Add a line with the same indentation:

```yaml
title:
  bg: Къща в Казанлък
  en: House in Kazanlak
  de: Haus in Kasanlak
```

For pages (`content/pages/`) and legal texts (`content/legal/`) you add a separate file: next to `about.bg.md` add `about.en.md` (or `about.de.md`) with the same front part between `---` and the translated text. Without a translation the site shows the Bulgarian text with the note "Translation to follow".

## 4. Hide or show a project

Open `content/projects/<folder>/project.yaml`.

- To hide: add the line `draft: true` (top level, no indentation).
- To show: delete the line or write `draft: false`.

The project stays in the files; it is only not shown on the site.

## 5. Add a publication (PDF)

Example: a new public invitation.

1. Upload the PDF to `content/publications/`: **Add file → Upload files**. Use only Latin letters, digits and hyphens in the name, for example `2026-10-invitation.pdf`.
2. Open `content/publications.yaml`, click the pencil and add a row at the end of the list (mind the indentation):

```yaml
- programme: BG05SFPR002-1.004-1772-C01
  kind: procurement
  title:
    bg: Публична покана
    en: Public invitation
  file: publications/2026-10-invitation.pdf
  published_on: 2026-10-15
```

`kind` is `eu_notice`, `procurement` or `other`. `programme` is a code from `content/eu-programmes.yaml` (optional). `published_on` is `YYYY-MM-DD`.

## 6. Add a partner

1. Upload the logo (`.png` or `.svg`) to `content/partners/`: **Add file → Upload files** (the folder is created if you type `partners/` in the name).
2. In `content/home.yaml` find `partners: []` at the end and change it:

```yaml
partners:
  - name: Company name
    role:
      bg: Архитектурно проектиране
      en: Architectural design
    logo: partners/company-name.png
    url: https://example.com
```

For another partner add another block starting with `-`, same indentation. `url` is optional.

List only partners that agreed to it.

## 7. Change contact details

All in `content/settings.yaml`: address (`address`), phone (`phone`), opening hours (`hours`), e-mail (`email`).

```yaml
phone: '+359 88 863 6034'
email: info@tekomltd.com
```

The phone and the EIK (`eik`) go in quotes.

## 8. A project in progress

A job we work on now: our own building, a client's house or a facade. The site shows its stages, the expected completion and a log of updates. When the work is done, it becomes a normal finished project and keeps its log.

- Start it as in "1. Add a project", but **without** `year`, and add a `progress` block at the bottom. Copy the block for the kind (`building`, `house` or `facade`) from the Bulgarian section above: the stage list is ready, with no dates.
- `expected: 2028-Q1` (optional) is the quarter we expect to finish. `permit` (optional) is the building permit. `note` (optional) is a short line for visitors, for example when a date moves.
- A stage of your own: write `label: { bg: … }` instead of `key`.
- A stage under way gets `started: YYYY-MM-DD`; a finished stage also gets `done: YYYY-MM-DD`.
- An update is a file `updates/YYYY-MM-DD.bg.md` in the project folder, with `photos:` in its front matter and the text below. `pnpm new-update <folder>` makes one with today's date. Photos go in the `updates` folder and only in the `.bg.md` file; `.en.md` / `.de.md` hold the translated text.
- Write at least monthly. After 45 days without an update, the check prints a warning; the site still publishes.
- The location is what you write. For a private house, write only the village or area in `place`.
- Never write prices, amounts, the client's name, EIK or personal names.
- To finish: `status: done`, add `year`, and give every stage a `done` date.

## 9. A building for sale

A building where we sell flats, garages, parking spaces, storage rooms or shops. The site shows how many units there are and how many are free, the floors as a drawing, a plan of each floor and one page per unit with an e-mail enquiry button. **Never write prices**: the files are public, and the check refuses any `price:` line.

- **Prepare each floor's DXF once.** Add one layer `TEKOM_UNIT`. On it, draw one closed polyline per unit along its outer walls, with one text inside holding the unit code (`12`, `A3`). Nothing else goes on that layer. Never commit the DXF: the check refuses `.dxf` and `.dwg` files under `content/`.
- **Convert it:** `pnpm blueprint <project> <floor> path/to/floor.dxf`. It writes `plans/<floor>.svg` and a `units/<code>.yaml` stub per new unit with the built area measured from the drawing. It prints the length unit it detected; correct it with `--units mm|cm|m`. When lines sit on more than one layer (furniture, installations, a title frame), it stops and lists the layers: name the walls with `--walls "Walls"` or `--walls "Walls,Columns"`. On an error it writes nothing and says where the outline is.
- **`sales` in `project.yaml`:** `view` (`switch` for a small building, `scroll` for a big one), optional `email`, `floors` bottom to top (`key`, optional `label`), `updated` (the day you checked the statuses). See the Bulgarian section for a full example.
- **A unit:** `code`, `type` (`flat`, `garage`, `parking`, `storage`, `shop`), `floors` (two for a maisonette), `rooms` (flats only), `area` (`total`, `built`, `net`, with net ≤ built ≤ total), optional `terrace`, `orientation`, `note`, and `status` (`free`, `reserved`, `upcoming`, `sold`).
- **Change a status:** edit `status` in the unit file and set `updated` to today. Totals, floor counts and pages follow. After 45 days the check warns.
- **On the home page:** add `home: true` (and an optional `cta` with `label` and `href`, a page of the site or `mailto:`) to an update's `.bg.md` front matter. The newest such update shows above the rail.

## Before you submit

Every pull request has a short checklist (template): was the Deploy Preview opened, is the check green, how do the photos look on a phone. Tick it honestly.
