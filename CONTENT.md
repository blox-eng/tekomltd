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
- `use lowercase letters, digits and single hyphens` — в `slug` само малки латински букви, цифри и тирета: `nova-kashta`.
- `cannot read YAML` — объркан отстъп или липсващи кавички (вижте „Правила за YAML“).
- `wp_id ... is already used by ...` или `wp_slug ... is already used by ...` — редът е копиран от друг проект. В нов проект изтрийте реда.
- `... is outside Bulgaria` — координатите `lat`/`lng` са сгрешени или разменени (вижте „Нов проект“).
- `image must be a file under /media/` — снимка в страница сочи към друг сайт или към грешен път. Качете снимката в `content/` и я пишете с `/media/…` (вижте „Смяна на текст“).
- `file not found: the old address ... leads here` — файл, към който води адрес от стария сайт, е преименуван или изтрит. Върнете го със същото име или питайте разработчика.

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
- `use lowercase letters, digits and single hyphens` — `slug` uses only lowercase Latin letters, digits and hyphens: `nova-kashta`.
- `cannot read YAML` — wrong indentation or missing quotes (see "YAML rules").
- `wp_id ... is already used by ...` or `wp_slug ... is already used by ...` — the line was copied from another project. Delete it in a new project.
- `... is outside Bulgaria` — `lat`/`lng` are wrong or swapped (see "Add a project").
- `image must be a file under /media/` — an image in a page points at another site or a wrong path. Upload the image into `content/` and write it with `/media/…` (see "Change a text").
- `file not found: the old address ... leads here` — a file that an address of the old site leads to was renamed or deleted. Put it back under the same name, or ask the developer.

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

## Before you submit

Every pull request has a short checklist (template): was the Deploy Preview opened, is the check green, how do the photos look on a phone. Tick it honestly.
