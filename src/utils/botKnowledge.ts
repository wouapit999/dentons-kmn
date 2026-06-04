// ─────────────────────────────────────────────────────────────────────────────
// KMN Assistant — Built-in Knowledge Base
// Works 100% offline, no API key needed.
// ─────────────────────────────────────────────────────────────────────────────

export interface KBEntry {
  keywords: string[];
  answer:   { en: string; fr: string };
}

export const KNOWLEDGE_BASE: KBEntry[] = [
  // ── APP NAVIGATION ────────────────────────────────────────────────────────
  {
    keywords: ["matter","dossier","create matter","nouveau dossier","how to create","créer"],
    answer: {
      en: "**How to create a Matter:**\n1. Click **Matters** in the left sidebar\n2. Click the **+ New Matter** button (top right)\n3. Fill in: Matter Title, Client (required), Practice Area (required)\n4. Add jurisdiction, court, judge, opposing counsel if applicable\n5. Choose billing model: Hourly / Flat Fee / Contingency / Retainer\n6. Click **Save**\n\nThe matter gets a unique ID like `DK-2026-001`. You can then add team members, upload documents, log time, and create tasks from the matter detail view.",
      fr: "**Comment créer un Dossier :**\n1. Cliquez sur **Dossiers** dans la barre de navigation\n2. Cliquez sur **+ Nouveau Dossier** (en haut à droite)\n3. Renseignez : Intitulé du dossier, Client (obligatoire), Domaine de pratique (obligatoire)\n4. Ajoutez la juridiction, le tribunal, le juge, l'avocat adverse si applicable\n5. Choisissez le modèle de facturation : Horaire / Forfait / Résultat / Provision\n6. Cliquez sur **Enregistrer**\n\nLe dossier reçoit un identifiant unique comme `DK-2026-001`. Vous pouvez ensuite ajouter des membres d'équipe, des documents, du temps et des tâches.",
    },
  },
  {
    keywords: ["client","create client","nouveau client","add client","ajouter client"],
    answer: {
      en: "**How to create a Client:**\n1. Go to **Clients** in the sidebar\n2. Click **+ New Client**\n3. Fill in: Client Name (required), Client Type (Individual/Company/Government/NGO), Email (required)\n4. Add phone, address, Tax ID (RCCM/Numéro Fiscal), contact person\n5. Optionally enable the **Client Portal**\n6. Click **Save**\n\nOnce saved, the client appears in all dropdown menus when creating matters or invoices.",
      fr: "**Comment créer un Client :**\n1. Allez dans **Clients** dans la barre de navigation\n2. Cliquez sur **+ Nouveau Client**\n3. Renseignez : Nom (obligatoire), Type de client (Particulier/Entreprise/Gouvernement/ONG), Email (obligatoire)\n4. Ajoutez téléphone, adresse, numéro fiscal (RCCM), personne de contact\n5. Activez le **Portail Client** si nécessaire\n6. Cliquez sur **Enregistrer**\n\nUne fois enregistré, le client apparaît dans tous les menus déroulants lors de la création de dossiers ou de factures.",
    },
  },
  {
    keywords: ["invoice","facture","create invoice","billing","facturation","line item"],
    answer: {
      en: "**How to create an Invoice:**\n1. Go to **Billing** → **Invoices** tab\n2. Click **+ New Invoice**\n3. Select **Client** and **Matter** (both required)\n4. Set invoice date, due date, payment terms, billing model\n5. Click **+ Add Line Item** to add fees, time charges or expenses\n   - OR select a matter first, then click **Import Time Entries** to auto-import billable hours\n   - OR click **Import Expenses** to add billable disbursements\n6. VAT (19.25%) is calculated automatically\n7. Add notes/bank details, then click **Save**\n\nThe invoice is saved as **Draft**. Click **Send** to mark it as sent, then **Record Payment** when paid.\n\n💡 Tip: Use the **Status Management** tab to bulk-approve time entries before invoicing.",
      fr: "**Comment créer une Facture :**\n1. Allez dans **Facturation** → onglet **Factures**\n2. Cliquez sur **+ Nouvelle Facture**\n3. Sélectionnez le **Client** et le **Dossier** (obligatoires)\n4. Définissez la date de facture, l'échéance, les conditions de paiement, le modèle de facturation\n5. Cliquez sur **+ Ajouter une Ligne** pour ajouter des honoraires, heures ou dépenses\n   - OU sélectionnez d'abord un dossier, puis cliquez **Importer les entrées de temps** pour auto-importer les heures facturables\n   - OU cliquez **Importer les Dépenses** pour ajouter les débours facturables\n6. La TVA (19,25%) est calculée automatiquement\n7. Ajoutez des notes/coordonnées bancaires, puis cliquez **Enregistrer**\n\nLa facture est sauvegardée en **Brouillon**. Cliquez sur **Envoyer** puis **Enregistrer un Paiement** une fois réglée.",
    },
  },
  {
    keywords: ["time","tracking","time entry","billable hours","suivi du temps","heures","saisie"],
    answer: {
      en: "**How to log Time Entries:**\n1. Go to **Time Tracking** in the sidebar\n2. Click **+ New Entry** or press ▶ **Start Timer** for real-time tracking\n3. Select the **Matter**, enter **hours**, choose the **Activity** type (drafting, court appearance, legal research, etc.)\n4. Set your billing rate and check **Billable** if applicable\n5. Click **Save**\n\n**To approve time entries** (Admin/Finance/Managing Partner only):\n- Go to **Billing** → **🔁 Status Management** tab\n- In the Time Entries section, change status from **⏳ Pending** to **✅ Approved**\n- Use **Approve All** for bulk approval\n\nOnce approved, entries can be imported directly into invoices.",
      fr: "**Comment saisir du Temps :**\n1. Allez dans **Suivi du Temps** dans la barre de navigation\n2. Cliquez sur **+ Nouvelle Saisie** ou appuyez sur ▶ **Démarrer le Chronomètre**\n3. Sélectionnez le **Dossier**, saisissez les **heures**, choisissez l'**Activité** (rédaction, audience, recherche juridique, etc.)\n4. Définissez votre taux horaire et cochez **Facturable** si applicable\n5. Cliquez sur **Enregistrer**\n\n**Pour approuver les entrées de temps** (Admin/Finance/Associé Gérant uniquement) :\n- Allez dans **Facturation** → onglet **🔁 Gestion des Statuts**\n- Dans la section Entrées de Temps, changez le statut de **⏳ En attente** à **✅ Approuvé**\n- Utilisez **Tout Approuver** pour une approbation en masse",
    },
  },
  {
    keywords: ["document","upload","google drive","onedrive","link","document management"],
    answer: {
      en: "**How to manage Documents:**\n1. Go to **Documents** in the sidebar\n2. Click **+ Add Document**\n3. Enter the document name (e.g. `Contract_SCP_v1.pdf`)\n4. Paste a **Google Drive / OneDrive / Dropbox** share link\n5. Select document type and link to a matter\n6. Click **Save**\n\n**To get a Google Drive link:**\n→ Upload file → Right-click → Share → Copy link\n\n**To get an OneDrive link:**\n→ Upload file → Share → Copy link\n\nDocuments are tracked per matter, and any team member can open them from the system.",
      fr: "**Comment gérer les Documents :**\n1. Allez dans **Documents** dans la barre de navigation\n2. Cliquez sur **+ Ajouter un Document**\n3. Saisissez le nom du document (ex. `Contrat_SCP_v1.pdf`)\n4. Collez un lien partagé **Google Drive / OneDrive / Dropbox**\n5. Sélectionnez le type de document et liez-le à un dossier\n6. Cliquez sur **Enregistrer**\n\n**Pour obtenir un lien Google Drive :**\n→ Chargez le fichier → Clic droit → Partager → Copier le lien\n\n**Pour obtenir un lien OneDrive :**\n→ Chargez le fichier → Partager → Copier le lien",
    },
  },
  {
    keywords: ["task","tâche","kanban","to do","assign","priority"],
    answer: {
      en: "**How to manage Tasks:**\n1. Go to **Tasks** in the sidebar\n2. Click **+ New Task**\n3. Enter task title, assign to a team member, set due date and priority (Urgent/High/Medium/Low)\n4. Link to a matter (optional) and add a description\n5. Click **Save**\n\nTasks appear on the **Kanban board** with 4 columns: To Do / In Progress / Under Review / Done.\n\n- Drag tasks between columns to update status\n- Click ✓ to mark as complete\n- Overdue tasks are highlighted in red\n- Use the table view below the Kanban for a full list",
      fr: "**Comment gérer les Tâches :**\n1. Allez dans **Tâches** dans la barre de navigation\n2. Cliquez sur **+ Nouvelle Tâche**\n3. Saisissez le titre, assignez à un membre de l'équipe, définissez l'échéance et la priorité\n4. Liez à un dossier (optionnel) et ajoutez une description\n5. Cliquez sur **Enregistrer**\n\nLes tâches apparaissent sur le **tableau Kanban** avec 4 colonnes : À Faire / En Cours / En Révision / Terminé.\n\n- Cliquez ✓ pour marquer comme terminé\n- Les tâches en retard sont surlignées en rouge\n- Utilisez le tableau en dessous du Kanban pour une vue complète",
    },
  },
  {
    keywords: ["report","export","pdf","excel","rapport","exporter"],
    answer: {
      en: "**How to export Reports:**\n1. Go to **Reports** in the sidebar\n2. Select a report tab: Financial / Matters / Time / Clients\n3. Set the date range using the date pickers\n4. Click **📄 Export PDF** or **📊 Export Excel** buttons\n\nEach export includes the Dentons KMN logo, firm header, gold accent line, and page numbers.\n\n**Available reports:**\n- **Financial**: Invoice register with totals, paid, balance\n- **Matters**: Matter profitability (billed vs collected vs expenses)\n- **Time**: Lawyer productivity (hours + billable amounts)\n- **Clients**: Client revenue summary\n\nYou can also export directly from **Billing** tabs (Invoices, Payments, Expenses).",
      fr: "**Comment exporter des Rapports :**\n1. Allez dans **Rapports** dans la barre de navigation\n2. Sélectionnez un onglet : Financier / Dossiers / Temps / Clients\n3. Définissez la plage de dates avec les sélecteurs\n4. Cliquez sur **📄 Exporter PDF** ou **📊 Exporter Excel**\n\nChaque export inclut le logo Dentons KMN, l'en-tête du cabinet, la ligne dorée et les numéros de page.\n\n**Rapports disponibles :**\n- **Financier** : Registre des factures avec totaux, payé, solde\n- **Dossiers** : Rentabilité par dossier (facturé vs encaissé vs dépenses)\n- **Temps** : Productivité des avocats (heures + montants facturables)\n- **Clients** : Résumé des revenus par client",
    },
  },
  {
    keywords: ["password","mot de passe","change password","changer","user","utilisateur","profile"],
    answer: {
      en: "**Password & User Management** (Administrator only):\n1. Go to **Users** in the sidebar\n2. Find the user in the list\n3. Click the 🔑 **key icon** to change their password\n4. Enter the new password (min. 6 characters), confirm, click **Change Password**\n\nTo edit a user's role or department:\n- Click the ✏️ **edit icon**\n- Change role, department, billing rate, or email\n- Click **Save**\n\nTo deactivate a user: click the **UserX icon** (cannot deactivate Administrator accounts).\n\n⚠️ Only the Administrator can change passwords and roles.",
      fr: "**Gestion des mots de passe & utilisateurs** (Administrateur uniquement) :\n1. Allez dans **Utilisateurs** dans la barre de navigation\n2. Trouvez l'utilisateur dans la liste\n3. Cliquez sur l'icône 🔑 **clé** pour changer son mot de passe\n4. Saisissez le nouveau mot de passe (min. 6 caractères), confirmez, cliquez **Changer le mot de passe**\n\nPour modifier le rôle ou le département d'un utilisateur :\n- Cliquez sur l'icône ✏️ **modifier**\n- Changez le rôle, département, taux horaire ou email\n- Cliquez **Enregistrer**\n\n⚠️ Seul l'Administrateur peut modifier les mots de passe et les rôles.",
    },
  },
  {
    keywords: ["status","statut","approve","approuver","change status","changer statut","pending","overdue"],
    answer: {
      en: "**Status Management** (Admin / Finance / Managing Partner only):\n\nGo to **Billing** → **🔁 Status Management** tab.\n\n**Time Entries:**\n- Approve/reject each entry individually\n- Click **✅ Approve All Pending** for bulk approval\n- Mark entries as Billed / Unbilled\n\n**Invoices:**\n- Change any invoice from: `Draft → Sent → Partial → Paid → Overdue → Cancelled`\n- Use the dropdown in the Status column\n\n**Expenses:**\n- Change from `Pending → Approved → Billed`\n- Click **✅ Approve All** for bulk expense approval\n\n**Retainers:**\n- Change from `Active → Depleted → Cancelled`",
      fr: "**Gestion des Statuts** (Admin / Finance / Associé Gérant uniquement) :\n\nAllez dans **Facturation** → onglet **🔁 Gestion des Statuts**.\n\n**Entrées de Temps :**\n- Approuvez/rejetez chaque entrée individuellement\n- Cliquez sur **✅ Tout Approuver** pour une approbation en masse\n- Marquez les entrées comme Facturées / Non facturées\n\n**Factures :**\n- Changez n'importe quelle facture de : `Brouillon → Envoyée → Partiel → Payée → En retard → Annulée`\n\n**Dépenses :**\n- Changez de `En attente → Approuvée → Facturée`\n- Cliquez **✅ Tout Approuver** pour une approbation en masse\n\n**Provisions :**\n- Changez de `Active → Épuisée → Annulée`",
    },
  },

  // ── OHADA LAW ──────────────────────────────────────────────────────────────
  {
    keywords: ["ohada","company","société","sarl","sa","snc","type","uniform act","acte uniforme"],
    answer: {
      en: "**OHADA Company Types (AUSC):**\n\n**SARL** (Société à Responsabilité Limitée)\n- Min. capital: 1 XAF (no minimum since 2014 reform)\n- 1 to 50 shareholders\n- Most common SME structure\n\n**SA** (Société Anonyme)\n- Min. capital: 10,000,000 XAF\n- Min. 3 shareholders\n- Can list on stock exchange (BVMAC)\n\n**SNC** (Société en Nom Collectif)\n- All partners jointly and severally liable\n- No minimum capital\n\n**SCS** (Société en Commandite Simple)\n- Mix of general and limited partners\n\n**GIE** (Groupement d'Intérêt Économique)\n- For cooperative economic activities\n\n📎 Source: AUSC (Acte Uniforme relatif au Droit des Sociétés Commerciales)\n🔗 https://www.ohada.com\n🔗 RCCM registration: https://www.apicam.cm",
      fr: "**Types de sociétés OHADA (AUSC) :**\n\n**SARL** (Société à Responsabilité Limitée)\n- Capital minimum : 1 FCFA (depuis la réforme 2014)\n- 1 à 50 associés\n- Structure PME la plus courante\n\n**SA** (Société Anonyme)\n- Capital minimum : 10 000 000 FCFA\n- Min. 3 actionnaires\n- Peut être cotée en bourse (BVMAC)\n\n**SNC** (Société en Nom Collectif)\n- Associés indéfiniment et solidairement responsables\n- Pas de capital minimum\n\n**SCS** (Société en Commandite Simple)\n- Mélange de commandités et commanditaires\n\n**GIE** (Groupement d'Intérêt Économique)\n- Pour activités économiques coopératives\n\n📎 Source : AUSC (Acte Uniforme relatif au Droit des Sociétés Commerciales)\n🔗 https://www.ohada.com\n🔗 Immatriculation RCCM : https://www.apicam.cm",
    },
  },
  {
    keywords: ["arbitration","arbitrage","ccja","dispute","litige","icс","camc"],
    answer: {
      en: "**Arbitration in OHADA & Cameroon:**\n\n**CCJA Arbitration** (primary OHADA arbitration body)\n- Governs commercial disputes in all 17 OHADA member states\n- CCJA awards are immediately enforceable in all member states\n- 🔗 https://www.ccja-ohada.org\n\n**CAMC** (Centre d'Arbitrage, de Médiation et de Conciliation)\n- Local Cameroon arbitration centre (attached to GICAM)\n- 🔗 https://www.camc-cmb.org\n\n**International Arbitration:**\n- ICC Paris: 🔗 https://iccwbo.org/dispute-resolution/dispute-resolution-services/arbitration/\n- ICSID (investment disputes): 🔗 https://icsid.worldbank.org\n\n**AUA** (OHADA Uniform Act on Arbitration) governs the procedure.\n\n📌 Dentons KMN specialises in CCJA and ICC arbitration proceedings.",
      fr: "**Arbitrage en droit OHADA & Cameroun :**\n\n**Arbitrage CCJA** (organe principal d'arbitrage OHADA)\n- Régit les litiges commerciaux dans les 17 États membres de l'OHADA\n- Les sentences CCJA sont immédiatement exécutoires dans tous les États membres\n- 🔗 https://www.ccja-ohada.org\n\n**CAMC** (Centre d'Arbitrage, de Médiation et de Conciliation)\n- Centre d'arbitrage local au Cameroun (rattaché au GICAM)\n- 🔗 https://www.camc-cmb.org\n\n**Arbitrage international :**\n- CCI Paris : 🔗 https://iccwbo.org\n- CIRDI (litiges d'investissement) : 🔗 https://icsid.worldbank.org\n\n**AUA** (Acte Uniforme relatif à l'Arbitrage) régit la procédure.\n\n📌 Dentons KMN est spécialisé dans les procédures d'arbitrage CCJA et CCI.",
    },
  },
  {
    keywords: ["vat","tva","tax","impôt","fiscal","rate","taux","19","cameroon tax"],
    answer: {
      en: "**Tax Rates in Cameroon:**\n\n**VAT (TVA):** 19.25%\n- Standard rate: 17.5%\n- Municipal surtax (CSIP): 10% of VAT = +1.75%\n- Total effective rate: **19.25%**\n- Exempt: basic food, medicines, education services\n\n**Corporate Income Tax (IS):** 33%\n- Minimum tax: 2.2% of turnover (if IS calculated is lower)\n\n**Withholding Tax (IRCM):**\n- Dividends: 16.5%\n- Royalties: 15%\n- Services from foreign companies: 15%\n\n**Personal Income Tax (IRPP):** Progressive 10%–38.5%\n\n**Stamp Duty:** Varies by document type\n\n📎 Official source: Direction Générale des Impôts\n🔗 https://www.impots.cm",
      fr: "**Taux d'imposition au Cameroun :**\n\n**TVA :** 19,25%\n- Taux standard : 17,5%\n- Taxe communale (CSIP) : 10% de la TVA = +1,75%\n- Taux effectif total : **19,25%**\n- Exonérés : denrées alimentaires de base, médicaments, services d'éducation\n\n**Impôt sur les Sociétés (IS) :** 33%\n- Impôt minimum : 2,2% du chiffre d'affaires\n\n**Impôt sur le Revenu des Capitaux Mobiliers (IRCM) :**\n- Dividendes : 16,5%\n- Redevances : 15%\n- Prestations de sociétés étrangères : 15%\n\n**IRPP :** Progressif de 10% à 38,5%\n\n📎 Source officielle : Direction Générale des Impôts\n🔗 https://www.impots.cm",
    },
  },
  {
    keywords: ["labour","travail","employment","code du travail","dismissal","licenciement","contract","contrat"],
    answer: {
      en: "**Cameroon Labour Law (Code du Travail — Law No. 92/007 of 14 August 1992):**\n\n**Employment contracts:**\n- CDD (fixed-term): max 2 years, renewable once\n- CDI (open-ended): standard employment\n- Part-time and seasonal contracts possible\n\n**Working hours:** 40h/week (private sector), 48h/week (some sectors)\n\n**Leave:** 18 working days/year minimum\n\n**Minimum wage (SMIG):** 41,875 XAF/month (verify current rate)\n\n**Dismissal:**\n- Must have valid reason (economic, professional misconduct)\n- Notice period: 1–3 months depending on seniority\n- Severance: based on years of service\n- Economic redundancy requires MINTSS authorization\n\n**Collective redundancy:** Requires prior consultation with employee representatives and authorization from MINTSS\n\n📎 Sources:\n🔗 MINTSS: https://www.mintss.gov.cm\n🔗 ILO Cameroon: https://www.ilo.org/africa/countries-covered/cameroon\n🔗 CNPS: https://www.cnps.cm",
      fr: "**Droit du travail camerounais (Code du Travail — Loi n°92/007 du 14 août 1992) :**\n\n**Contrats de travail :**\n- CDD : max 2 ans, renouvelable une fois\n- CDI : contrat de droit commun\n- Temps partiel et contrats saisonniers possibles\n\n**Durée du travail :** 40h/semaine (secteur privé), 48h/sem (certains secteurs)\n\n**Congés :** 18 jours ouvrables/an minimum\n\n**Salaire minimum (SMIG) :** 41 875 FCFA/mois (vérifier le taux actuel)\n\n**Licenciement :**\n- Doit avoir une cause réelle et sérieuse (économique, faute professionnelle)\n- Préavis : 1 à 3 mois selon l'ancienneté\n- Indemnité de licenciement selon les années de service\n- Licenciement économique nécessite l'autorisation du MINTSS\n\n**Licenciements collectifs :** Nécessitent consultation préalable des représentants du personnel et autorisation du MINTSS\n\n📎 Sources :\n🔗 MINTSS : https://www.mintss.gov.cm\n🔗 OIT Cameroun : https://www.ilo.org/africa/countries-covered/cameroon\n🔗 CNPS : https://www.cnps.cm",
    },
  },
  {
    keywords: ["real estate","property","foncier","land","terrain","titre","certificate","ownership"],
    answer: {
      en: "**Cameroon Real Estate & Land Law:**\n\n**Legal framework:** Land Tenure Code (Ordinance No. 74-1 of 6 July 1974)\n\n**Types of land ownership:**\n- **Certificate Foncier** (titre foncier): absolute proof of ownership, indefeasible\n- **Droit de jouissance**: right to use, not full ownership\n- National lands: unregistered land managed by the State\n\n**Key steps for property acquisition:**\n1. Verify title at **MINDCAF** (Ministry of State Property)\n2. Due diligence on encumbrances, mortgages, boundaries\n3. Notarial deed (acte notarié) — required for all property transfers\n4. Registration with the Land Registry\n5. Transfer tax: 15% (Droits de mutation)\n\n**Building permits:** Required from local urban planning authority (Délégation Régionale des Travaux Publics)\n\n📎 Sources:\n🔗 MINDCAF: https://www.mindcaf.gov.cm\n🔗 Official gazette: https://www.spm.gov.cm",
      fr: "**Droit Foncier & Immobilier camerounais :**\n\n**Cadre légal :** Code Foncier (Ordonnance n°74-1 du 6 juillet 1974)\n\n**Types de propriété foncière :**\n- **Titre foncier** : preuve absolue et irréfragable de propriété\n- **Droit de jouissance** : droit d'usage, sans propriété pleine\n- Terres nationales : terres non immatriculées gérées par l'État\n\n**Étapes clés pour l'acquisition immobilière :**\n1. Vérification du titre au **MINDCAF** (Ministère des Domaines)\n2. Diligence sur les charges, hypothèques, limites\n3. Acte notarié obligatoire pour tout transfert de propriété\n4. Enregistrement au Livre Foncier\n5. Droits de mutation : 15%\n\n**Permis de construire :** Requis auprès de la Délégation Régionale des Travaux Publics\n\n📎 Sources :\n🔗 MINDCAF : https://www.mindcaf.gov.cm\n🔗 Journal officiel : https://www.spm.gov.cm",
    },
  },
  {
    keywords: ["ip","intellectual property","propriété intellectuelle","oapi","patent","trademark","marque","copyright"],
    answer: {
      en: "**Intellectual Property in Cameroon (OAPI):**\n\nCameroon is a member of **OAPI** (Organisation Africaine de la Propriété Intellectuelle), which provides a single IP registration covering 17 African states.\n\n**What OAPI covers:**\n- 📋 Patents (Brevets d'invention): 20 years\n- ™ Trademarks (Marques): 10 years, renewable\n- 🎨 Industrial designs (Dessins et modèles): 5 years, renewable to 15\n- 🌱 Plant varieties\n- 📖 Literary & artistic works (copyright): automatic protection\n\n**Key facts:**\n- One OAPI registration protects you in all 17 member states\n- Applications filed at OAPI in Yaoundé, Cameroon\n- Processing: 6–18 months for patents\n\n🔗 OAPI: https://www.oapi.int\n🔗 OAPI Yaoundé: BP 887, Yaoundé, Cameroon\n\n📌 Dentons KMN handles OAPI filings and IP litigation.",
      fr: "**Propriété Intellectuelle au Cameroun (OAPI) :**\n\nLe Cameroun est membre de l'**OAPI** (Organisation Africaine de la Propriété Intellectuelle), qui offre une protection unique dans 17 États africains.\n\n**Ce que couvre l'OAPI :**\n- 📋 Brevets d'invention : 20 ans\n- ™ Marques de commerce : 10 ans, renouvelables\n- 🎨 Dessins et modèles industriels : 5 ans, renouvelables jusqu'à 15 ans\n- 🌱 Obtentions végétales\n- 📖 Œuvres littéraires et artistiques : protection automatique\n\n**Points clés :**\n- Un enregistrement OAPI vous protège dans 17 États membres\n- Dépôts effectués auprès de l'OAPI à Yaoundé\n- Délai de traitement : 6 à 18 mois pour les brevets\n\n🔗 OAPI : https://www.oapi.int\n🔗 OAPI Yaoundé : BP 887, Yaoundé, Cameroun\n\n📌 Dentons KMN gère les dépôts OAPI et le contentieux de propriété intellectuelle.",
    },
  },
  {
    keywords: ["banking","finance","cobac","beac","cemac","bank","regulation","banque"],
    answer: {
      en: "**Banking & Finance Law in Cameroon:**\n\n**Regulatory bodies:**\n- **COBAC** (Commission Bancaire de l'Afrique Centrale): Banking supervisor for CEMAC zone\n  🔗 https://www.beac.int/cobac\n- **BEAC** (Banque des États de l'Afrique Centrale): Central bank of 6 CEMAC states\n  🔗 https://www.beac.int\n- **COSUMAF**: Capital markets regulator\n\n**Key regulations:**\n- CEMAC Regulation on cross-border payments\n- COBAC Regulation on credit institutions\n- Anti-money laundering: GABAC (FATF-style body for Central Africa)\n\n**Currency:** XAF (CFA Franc BEAC) — pegged to EUR at 655.957 XAF/EUR\n\n**Mobile Money regulation:**\n- MTN Mobile Money and Orange Money regulated by COBAC/MINPOSTEL\n- Key for payments in legal services\n\n**BVMAC** (Bourse des Valeurs Mobilières de l'Afrique Centrale): Regional stock exchange",
      fr: "**Droit Bancaire & Financier au Cameroun :**\n\n**Organes de régulation :**\n- **COBAC** (Commission Bancaire de l'Afrique Centrale) : Superviseur bancaire de la zone CEMAC\n  🔗 https://www.beac.int/cobac\n- **BEAC** (Banque des États de l'Afrique Centrale) : Banque centrale de 6 États CEMAC\n  🔗 https://www.beac.int\n- **COSUMAF** : Régulateur des marchés financiers\n\n**Réglementations clés :**\n- Règlement CEMAC sur les transferts transfrontaliers\n- Règlement COBAC sur les établissements de crédit\n- Lutte anti-blanchiment : GABAC (organisme de type GAFI pour l'Afrique centrale)\n\n**Monnaie :** FCFA (CFA Franc BEAC) — arrimé à l'EUR à 655,957 FCFA/EUR\n\n**Mobile Money :**\n- MTN Mobile Money et Orange Money régulés par la COBAC/MINPOSTEL\n- Clé pour les paiements en services juridiques",
    },
  },
  {
    keywords: ["cobac","what is cobac","qu'est-ce que cobac"],
    answer: {
      en: "**COBAC** stands for **Commission Bancaire de l'Afrique Centrale**.\n\nIt is the banking regulatory and supervisory body for the **CEMAC** zone (6 Central African states: Cameroon, Chad, CAR, Congo, Equatorial Guinea, Gabon).\n\n**Functions:**\n- Authorises and supervises banks and financial institutions\n- Ensures compliance with banking regulations\n- Issues sanctions for regulatory breaches\n- Works alongside BEAC (central bank)\n\n**Headquarters:** Yaoundé, Cameroon (at BEAC premises)\n\n🔗 https://www.beac.int/cobac\n\n📌 Any banking or finance legal matter in Cameroon must consider COBAC regulations.",
      fr: "**COBAC** signifie **Commission Bancaire de l'Afrique Centrale**.\n\nC'est l'organe de réglementation et de supervision bancaire pour la zone **CEMAC** (6 États d'Afrique centrale : Cameroun, Tchad, RCA, Congo, Guinée Équatoriale, Gabon).\n\n**Fonctions :**\n- Autorise et supervise les banques et établissements financiers\n- Assure la conformité aux réglementations bancaires\n- Émet des sanctions en cas d'infraction\n- Travaille conjointement avec la BEAC (banque centrale)\n\n**Siège :** Yaoundé, Cameroun (dans les locaux de la BEAC)\n\n🔗 https://www.beac.int/cobac\n\n📌 Tout dossier juridique bancaire ou financier au Cameroun doit tenir compte des réglementations de la COBAC.",
    },
  },
  {
    keywords: ["dentons kmn","firm","cabinet","about","qui sommes","who are","team","équipe"],
    answer: {
      en: "**Dentons KMN — Kouengoua Minou Nkongho Law Firm**\n\n📍 Douala, Cameroon\n📧 kmn@dentons.com\n🌐 https://www.dentons.com/en/global-presence/africa/cameroon/douala\n\n**Practice areas:**\nCorporate Law · Litigation · Employment Law · Real Estate · Intellectual Property · Tax Law · Banking & Finance · Arbitration · Family Law · Criminal Law\n\n**Managing Partners:** KOUENGOUA, Sterling MINOU, Agbor Nkongho T.\n\n**Part of Dentons** — the world's largest law firm by lawyer count, with offices in 80+ countries.\n\n**Languages:** English & French (Cameroon is bilingual)\n\nDentons KMN provides full-service legal advice to local and international clients operating in Cameroon and the CEMAC region.",
      fr: "**Dentons KMN — Cabinet Kouengoua Minou Nkongho**\n\n📍 Douala, Cameroun\n📧 kmn@dentons.com\n🌐 https://www.dentons.com/en/global-presence/africa/cameroon/douala\n\n**Domaines de pratique :**\nDroit des Sociétés · Contentieux · Droit du Travail · Immobilier · Propriété Intellectuelle · Droit Fiscal · Banque & Finance · Arbitrage · Droit de la Famille · Droit Pénal\n\n**Associés Gérants :** KOUENGOUA, Sterling MINOU, Agbor Nkongho T.\n\n**Membre de Dentons** — le plus grand cabinet d'avocats au monde par le nombre d'avocats, présent dans 80+ pays.\n\n**Langues :** Anglais et Français (le Cameroun est bilingue)\n\nDentons KMN fournit des conseils juridiques complets aux clients locaux et internationaux opérant au Cameroun et dans la région CEMAC.",
    },
  },
  {
    keywords: ["hello","hi","bonjour","salut","help","aide","start","commencer"],
    answer: {
      en: "👋 Hello! I'm **KMN Assistant**, your AI legal guide for Dentons KMN.\n\nI can help you with:\n\n**📱 App Navigation:**\n- Creating matters, clients, invoices\n- Time tracking and billing\n- Reports and exports\n- Status management\n\n**⚖️ Legal Knowledge:**\n- OHADA company law and uniform acts\n- Cameroon tax law (VAT, corporate tax)\n- Labour law and employment contracts\n- Real estate and land tenure\n- Banking regulations (COBAC, BEAC)\n- IP law (OAPI)\n- Arbitration (CCJA, CAMC)\n\nWhat would you like to know?",
      fr: "👋 Bonjour ! Je suis **l'Assistant KMN**, votre guide juridique IA pour Dentons KMN.\n\nJe peux vous aider avec :\n\n**📱 Navigation dans l'application :**\n- Créer des dossiers, clients, factures\n- Suivi du temps et facturation\n- Rapports et exports\n- Gestion des statuts\n\n**⚖️ Connaissances Juridiques :**\n- Droit des sociétés OHADA et actes uniformes\n- Droit fiscal camerounais (TVA, IS)\n- Droit du travail et contrats de travail\n- Immobilier et régime foncier\n- Réglementations bancaires (COBAC, BEAC)\n- Droit de la propriété intellectuelle (OAPI)\n- Arbitrage (CCJA, CAMC)\n\nQue souhaitez-vous savoir ?",
    },
  },
];

// ── Simple fuzzy matcher ───────────────────────────────────────────────────────
export function findAnswer(question: string, lang: string): string | null {
  const q = question.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  let bestMatch: KBEntry | null = null;
  let bestScore = 0;

  for (const entry of KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of entry.keywords) {
      const normKw = kw.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      if (q.includes(normKw)) score += normKw.split(" ").length * 2;
      else if (normKw.split(" ").some(w => q.includes(w) && w.length > 3)) score += 1;
    }
    if (score > bestScore) { bestScore = score; bestMatch = entry; }
  }

  if (bestMatch && bestScore >= 1) {
    return lang === "fr" ? bestMatch.answer.fr : bestMatch.answer.en;
  }
  return null;
}

// ── Default fallback ──────────────────────────────────────────────────────────
export const FALLBACK: Record<string, string> = {
  en: "I don't have a specific answer for that yet. Here are topics I can help with:\n\n• **App:** matters, clients, invoices, time tracking, reports, status management, documents, tasks, users\n• **Law:** OHADA companies, VAT/taxes, labour law, real estate, IP (OAPI), banking (COBAC/BEAC), arbitration (CCJA)\n• **Firm:** Dentons KMN practice areas and team\n\nTry rephrasing your question, or ask about one of the topics above!",
  fr: "Je n'ai pas encore de réponse spécifique pour cela. Voici les sujets sur lesquels je peux vous aider :\n\n• **Application :** dossiers, clients, factures, suivi du temps, rapports, gestion des statuts, documents, tâches, utilisateurs\n• **Droit :** sociétés OHADA, TVA/impôts, droit du travail, immobilier, PI (OAPI), banque (COBAC/BEAC), arbitrage (CCJA)\n• **Cabinet :** domaines de pratique et équipe Dentons KMN\n\nEssayez de reformuler votre question, ou posez-en une sur les sujets ci-dessus !",
};
