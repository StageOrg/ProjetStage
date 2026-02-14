import random
import string

def generate_username(prenom, nom):
    base = f"{prenom.lower()}.{nom.lower()}"
    suffix = ''.join(random.choices(string.digits, k=2))
    return f"{base}_{suffix}"
