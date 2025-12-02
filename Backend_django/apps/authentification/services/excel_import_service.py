import pandas as pd
from .user_creation_service import UserCreationService


class ExcelUserImportService:

    REQUIRED_HEADERS = ['nom', 'prenom', 'email', 'telephone', 'sexe', 'role']

    def import_users(self, excel_file):

        try:
            df = pd.read_excel(excel_file)
        except Exception:
            return {"success": False, "error": "Impossible de lire le fichier Excel"}

        headers = df.columns.str.lower().tolist()
        if not all(h in headers for h in self.REQUIRED_HEADERS):
            return {
                "success": False,
                "error": f"Les entêtes doivent contenir : {self.REQUIRED_HEADERS}"
            }

        total = len(df)
        success_count = 0
        ignored_count = 0
        errors = []
        created_users = []

        for index, row in df.iterrows():

            data = {
                "nom": str(row['nom']).strip(),
                "prenom": str(row['prenom']).strip(),
                "email": str(row['email']).strip(),
                "telephone": str(row['telephone']).strip(),
                "sexe": str(row['sexe']).strip(),
                "role": str(row['role']).strip(),
            }

            try:
                user = UserCreationService.create_user(data)

                success_count += 1
                created_users.append({
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.role
                })

            except Exception as e:
                ignored_count += 1
                errors.append({
                    "ligne": index + 2,
                    "email": data.get("email"),
                    "erreur": str(e)
                })

        return {
            "success": True,
            "total": total,
            "created_count": success_count,
            "ignored_count": ignored_count,
            "errors": errors,
            "created_users": created_users
        }
