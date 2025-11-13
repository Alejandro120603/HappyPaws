PRAGMA foreign_keys = ON;

-- ===== Usuarios =====
INSERT INTO Usuario (nombrecomp, email, password, telefono, ciudad) VALUES
  ('Daniel Alejandro', 'daniel@correo.com',  'dan123',  '555-111-2222', 'Tampico'),
  ('Gustavo Hernández', 'gustavo@correo.com', 'gus123', '555-333-4444', 'Monterrey');

-- ===== Refugios =====
-- Les pongo los IDs explícitos para poder usarlos en las llaves foráneas
INSERT INTO Refugio (idrefugio, nombreref, direccionref, horarioatenc, tiporef) VALUES
  (1, 'Refugio Patitas Felices', 'Calle 1 #123, Tampico', 'Lunes a Viernes 9:00–18:00', 'General'),
  (2, 'Hogar Verde de Reptiles', 'Av. Central #456, Monterrey', 'Martes a Domingo 10:00–17:00', 'Especializado en exóticos');

-- ===== Mascotas =====
-- Agaporni en el refugio 1, Iguana en el refugio 2
INSERT INTO Mascota (idrefugio, nombremasc, especie, raza, sexo, edady) VALUES
  (1, 'Luma', 'Ave', 'Agaporni', 'Hembra', 2),
  (2, 'Rex',  'Reptil', 'Iguana verde', 'Macho', 3);

-- ===== Responsables de Refugio =====
-- idres referencia al idrefugio, por eso uso 1 y 2
INSERT INTO Responsables_de_Refugio (idres, nombreres, email, password, telefono, direccionres) VALUES
  (1, 'Ana López', 'ana.refugio1@correo.com', 'ana.refugio1@correo.com', '555-777-8888', 'Calle 1 #123, Tampico'),
  (2, 'Carlos Pérez', 'carlos.refugio2@correo.com', 'carlos.refugio2@correo.com', '555-999-0000', 'Av. Central #456, Monterrey');
