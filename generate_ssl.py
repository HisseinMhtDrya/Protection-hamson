from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
import datetime

# Générer la clé privée
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
)

# Générer le certificat auto-signé
subject = issuer = x509.Name([
    x509.NameAttribute(NameOID.COUNTRY_NAME, "CD"),
    x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Kinshasa"),
    x509.NameAttribute(NameOID.LOCALITY_NAME, "Kinshasa"),
    x509.NameAttribute(NameOID.ORGANIZATION_NAME, "UNIKIN"),
    x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, "MSI"),
    x509.NameAttribute(NameOID.COMMON_NAME, "localhost"),
])

cert = x509.CertificateBuilder().subject_name(
    subject
).issuer_name(
    issuer
).public_key(
    private_key.public_key()
).serial_number(
    x509.random_serial_number()
).not_valid_before(
    datetime.datetime.utcnow()
).not_valid_after(
    datetime.datetime.utcnow() + datetime.timedelta(days=365)
).add_extension(
    x509.SubjectAlternativeName([
        x509.DNSName("localhost"),
    ]),
    critical=False,
).sign(private_key, hashes.SHA256())

# Sauvegarder la clé privée
with open("nginx/ssl/selfsigned.key", "wb") as f:
    f.write(private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    ))

# Sauvegarder le certificat
with open("nginx/ssl/selfsigned.crt", "wb") as f:
    f.write(cert.public_bytes(serialization.Encoding.PEM))

print("✅ Certificats SSL générés avec succès:")
print("   - nginx/ssl/selfsigned.key")
print("   - nginx/ssl/selfsigned.crt")
