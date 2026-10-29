# Terraform — ENCG ERP

L’hébergement n’est pas encore choisi. Ce répertoire prépare un module **portable de bootstrap Ubuntu**, sans présumer AWS, Azure ou un fournisseur de VPS et sans créer de ressource facturable.

Le module `bootstrap/` génère un document cloud-init : utilisateur `encg`, connexion SSH par clé publique, désactivation du mot de passe SSH et de l’accès root direct, mises à jour initiales, pare-feu SSH limité aux réseaux d’administration, HTTP/HTTPS et dossier `/opt/encg-erp`. Il ne déploie ni VM, ni DNS, ni base de données, ni Docker, ni application.

## Vérifier le module

```sh
cd infra/terraform/bootstrap
terraform init -backend=false
terraform fmt -check -recursive
terraform validate
terraform test
```

Pour préparer un futur plan, copier `terraform.tfvars.example` vers `terraform.tfvars`, puis remplacer la clé publique et l’adresse d’administration d’exemple. Ne jamais fournir de clé privée. Le réseau `203.0.113.0/24` est documentaire : ce n’est pas votre adresse réelle.

```sh
terraform plan
```

Après choix du fournisseur, son module VM/réseau pourra consommer la sortie `cloud_init`. Avant une création réelle : choisir la région, la taille et le budget, prévoir le stockage persistant, les sauvegardes, le pare-feu du fournisseur et un backend de state partagé chiffré/verrouillé. Le state, les plans et les fichiers de variables privés sont exclus de Git.

Docker Compose reste responsable de l’application et des outils de supervision. Terraform ne doit pas reprendre la propriété de conteneurs déjà gérés par Compose. L’installation Docker du futur serveur se fera selon la [documentation officielle Docker](https://docs.docker.com/engine/install/ubuntu/).

Les quatre tests du module vérifient la génération du bootstrap et le refus d’une clé SSH invalide ou d’une ouverture SSH globale, y compris un CIDR `/0` écrit avec des bits d’hôte.
