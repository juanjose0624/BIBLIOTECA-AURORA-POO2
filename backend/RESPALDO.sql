--
-- PostgreSQL database dump
--

\restrict fRkUKXDxVJfCFQKyJEcDBoGZvEX6cpfHDWgEdZXyJpntMDJf5o4MZxAIHQqycSz

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

-- Started on 2026-10-24 23:11:50

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 16422)
-- Name: libros; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.libros (
    id bigint NOT NULL,
    titulo character varying(150) NOT NULL,
    autor character varying(120) NOT NULL,
    isbn character varying(20),
    editorial character varying(100),
    anio_publicacion smallint,
    categoria character varying(60),
    descripcion text,
    cantidad_total integer DEFAULT 1 NOT NULL,
    cantidad_disponible integer DEFAULT 1 NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT libros_anio_ck CHECK (((anio_publicacion IS NULL) OR (anio_publicacion > 0))),
    CONSTRAINT libros_autor_ck CHECK ((char_length(btrim((autor)::text)) >= 2)),
    CONSTRAINT libros_cantidades_ck CHECK (((cantidad_total >= 0) AND (cantidad_disponible >= 0) AND (cantidad_disponible <= cantidad_total))),
    CONSTRAINT libros_titulo_ck CHECK ((char_length(btrim((titulo)::text)) >= 2))
);


ALTER TABLE public.libros OWNER TO postgres;

--
-- TOC entry 5001 (class 0 OID 0)
-- Dependencies: 222
-- Name: TABLE libros; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.libros IS 'Catálogo de libros disponibles en la biblioteca.';


--
-- TOC entry 221 (class 1259 OID 16421)
-- Name: libros_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.libros ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.libros_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 220 (class 1259 OID 16408)
-- Name: pqrs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pqrs (
    id bigint NOT NULL,
    nombre character varying(120) NOT NULL,
    correo character varying(254) NOT NULL,
    tipo character varying(15) NOT NULL,
    mensaje text NOT NULL,
    estado character varying(15) DEFAULT 'pendiente'::character varying NOT NULL,
    respuesta text,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    respondido_en timestamp with time zone,
    apellido character varying(120),
    CONSTRAINT pqrs_descripcion_ck CHECK ((char_length(btrim(mensaje)) >= 5)),
    CONSTRAINT pqrs_estado_ck CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'en_revision'::character varying, 'respondida'::character varying, 'cerrada'::character varying])::text[]))),
    CONSTRAINT pqrs_tipo_ck CHECK (((tipo)::text = ANY ((ARRAY['peticion'::character varying, 'queja'::character varying, 'reclamo'::character varying, 'sugerencia'::character varying])::text[])))
);


ALTER TABLE public.pqrs OWNER TO postgres;

--
-- TOC entry 5002 (class 0 OID 0)
-- Dependencies: 220
-- Name: TABLE pqrs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.pqrs IS 'Peticiones, quejas, reclamos y sugerencias independientes del sistema de usuarios.';


--
-- TOC entry 219 (class 1259 OID 16407)
-- Name: pqrs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.pqrs ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.pqrs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 224 (class 1259 OID 16439)
-- Name: prestamos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prestamos (
    id bigint NOT NULL,
    usuario_id bigint NOT NULL,
    libro_id bigint NOT NULL,
    fecha_prestamo date DEFAULT CURRENT_DATE NOT NULL,
    fecha_vencimiento date NOT NULL,
    fecha_devolucion date,
    estado character varying(15) DEFAULT 'prestado'::character varying NOT NULL,
    observaciones text,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT prestamos_devolucion_ck CHECK (((fecha_devolucion IS NULL) OR (fecha_devolucion >= fecha_prestamo))),
    CONSTRAINT prestamos_estado_ck CHECK (((estado)::text = ANY ((ARRAY['prestado'::character varying, 'devuelto'::character varying, 'vencido'::character varying])::text[]))),
    CONSTRAINT prestamos_fechas_ck CHECK ((fecha_vencimiento >= fecha_prestamo))
);


ALTER TABLE public.prestamos OWNER TO postgres;

--
-- TOC entry 5003 (class 0 OID 0)
-- Dependencies: 224
-- Name: TABLE prestamos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.prestamos IS 'Historial de préstamos y devoluciones de libros.';


--
-- TOC entry 223 (class 1259 OID 16438)
-- Name: prestamos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.prestamos ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.prestamos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 228 (class 1259 OID 16504)
-- Name: sanciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sanciones (
    id bigint NOT NULL,
    usuario_id bigint NOT NULL,
    prestamo_id bigint NOT NULL,
    dias_sancion integer NOT NULL,
    motivo text NOT NULL,
    fecha_inicio date DEFAULT CURRENT_DATE NOT NULL,
    fecha_fin date NOT NULL,
    estado character varying(20) DEFAULT 'activa'::character varying NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sanciones_dias_ck CHECK ((dias_sancion > 0)),
    CONSTRAINT sanciones_estado_ck CHECK (((estado)::text = ANY ((ARRAY['activa'::character varying, 'cumplida'::character varying, 'cancelada'::character varying])::text[]))),
    CONSTRAINT sanciones_fechas_ck CHECK ((fecha_fin >= fecha_inicio)),
    CONSTRAINT sanciones_motivo_ck CHECK ((length(TRIM(BOTH FROM motivo)) > 0))
);


ALTER TABLE public.sanciones OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16503)
-- Name: sanciones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.sanciones ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.sanciones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 226 (class 1259 OID 16466)
-- Name: solicitudes_prestamo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.solicitudes_prestamo (
    id bigint NOT NULL,
    usuario_id bigint NOT NULL,
    libro_id bigint NOT NULL,
    estado character varying(20) DEFAULT 'solicitado'::character varying NOT NULL,
    fecha_solicitud timestamp with time zone DEFAULT now() NOT NULL,
    fecha_respuesta timestamp with time zone,
    respondido_por bigint,
    observaciones text,
    prestamo_id bigint,
    CONSTRAINT solicitudes_aprobacion_ck CHECK (((((estado)::text = 'aprobado'::text) AND (prestamo_id IS NOT NULL)) OR (((estado)::text <> 'aprobado'::text) AND (prestamo_id IS NULL)))),
    CONSTRAINT solicitudes_estado_ck CHECK (((estado)::text = ANY ((ARRAY['solicitado'::character varying, 'aprobado'::character varying, 'rechazado'::character varying])::text[]))),
    CONSTRAINT solicitudes_respuesta_ck CHECK (((((estado)::text = 'solicitado'::text) AND (fecha_respuesta IS NULL)) OR (((estado)::text = ANY ((ARRAY['aprobado'::character varying, 'rechazado'::character varying])::text[])) AND (fecha_respuesta IS NOT NULL))))
);


ALTER TABLE public.solicitudes_prestamo OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16465)
-- Name: solicitudes_prestamo_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.solicitudes_prestamo ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.solicitudes_prestamo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 218 (class 1259 OID 16390)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id bigint NOT NULL,
    nombre character varying(60) NOT NULL,
    apellido character varying(60) NOT NULL,
    celular character varying(10) NOT NULL,
    correo character varying(254) NOT NULL,
    clave_hash text NOT NULL,
    sexo character varying(12) NOT NULL,
    rol character varying(13) DEFAULT 'usuario'::character varying NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT usuarios_apellido_ck CHECK ((char_length(btrim((apellido)::text)) >= 2)),
    CONSTRAINT usuarios_celular_ck CHECK (((celular)::text ~ '^3[0-9]{9}$'::text)),
    CONSTRAINT usuarios_correo_ck CHECK ((((correo)::text = lower((correo)::text)) AND ((correo)::text ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'::text))),
    CONSTRAINT usuarios_nombre_ck CHECK ((char_length(btrim((nombre)::text)) >= 2)),
    CONSTRAINT usuarios_rol_ck CHECK (((rol)::text = ANY ((ARRAY['usuario'::character varying, 'administrador'::character varying])::text[]))),
    CONSTRAINT usuarios_sexo_ck CHECK (((sexo)::text = ANY ((ARRAY['femenino'::character varying, 'masculino'::character varying, 'no_indica'::character varying])::text[])))
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 5004 (class 0 OID 0)
-- Dependencies: 218
-- Name: TABLE usuarios; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.usuarios IS 'Cuentas de la plataforma: lectores y administradores.';


--
-- TOC entry 5005 (class 0 OID 0)
-- Dependencies: 218
-- Name: COLUMN usuarios.clave_hash; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.usuarios.clave_hash IS 'Hash de la contraseña (bcrypt o argon2). Nunca se guarda en texto plano.';


--
-- TOC entry 5006 (class 0 OID 0)
-- Dependencies: 218
-- Name: COLUMN usuarios.rol; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.usuarios.rol IS 'usuario (valor por defecto al registrarse) o administrador.';


--
-- TOC entry 217 (class 1259 OID 16389)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.usuarios ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.usuarios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 4989 (class 0 OID 16422)
-- Dependencies: 222
-- Data for Name: libros; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.libros (id, titulo, autor, isbn, editorial, anio_publicacion, categoria, descripcion, cantidad_total, cantidad_disponible, creado_en) FROM stdin;
51	El principito	Antoine de Saint-Exupéry	PENDIENTE-050	Emecé Editores	\N	Literatura universal	\N	20	20	2026-10-23 23:00:47.513114-05
1	Cien años de soledad	Gabriel García Márquez	PENDIENTE-001	Editorial Sudamericana	1967	Realismo mágico	Historia de la familia Buendía en Macondo.	3	3	2026-10-23 10:55:56.672312-05
2	El amor en los tiempos del cólera	Gabriel García Márquez	PENDIENTE-002	Editorial Oveja Negra	1985	Romance	Una historia de amor que atraviesa el tiempo.	2	2	2026-10-23 10:55:56.672312-05
3	Crónica de una muerte anunciada	Gabriel García Márquez	PENDIENTE-003	Editorial Oveja Negra	1981	Novela	Reconstrucción de un asesinato anunciado.	2	2	2026-10-23 10:55:56.672312-05
15	El alquimista	Paulo Coelho	PENDIENTE-015	Editorial Rocco	1988	Ficción filosófica	Un joven pastor emprende un viaje en busca de su tesoro.	10	10	2026-10-23 10:55:56.672312-05
34	La tía Julia y el escribidor	Mario Vargas Llosa	PENDIENTE-034	Editorial Seix Barral	1977	Novela	Amor, escritura y radionovelas en Lima.	2	1	2026-10-23 10:55:56.672312-05
4	El coronel no tiene quien le escriba	Gabriel García Márquez	PENDIENTE-004	Aguirre Editor	1961	Novela	Un coronel espera durante años su pensión.	2	2	2026-10-23 10:55:56.672312-05
5	La hojarasca	Gabriel García Márquez	PENDIENTE-005	Editorial Losada	1955	Novela	Una familia afronta la muerte de un médico en Macondo.	1	1	2026-10-23 10:55:56.672312-05
6	Del amor y otros demonios	Gabriel García Márquez	PENDIENTE-006	Editorial Norma	1994	Romance	Una historia de amor, religión y superstición.	2	2	2026-10-23 10:55:56.672312-05
7	El otoño del patriarca	Gabriel García Márquez	PENDIENTE-007	Plaza & Janés	1975	Novela	Retrato literario del poder y la soledad de un dictador.	1	1	2026-10-23 10:55:56.672312-05
8	Doce cuentos peregrinos	Gabriel García Márquez	PENDIENTE-008	Editorial Sudamericana	1992	Cuentos	Doce relatos sobre latinoamericanos en Europa.	2	2	2026-10-23 10:55:56.672312-05
9	Rayuela	Julio Cortázar	PENDIENTE-009	Editorial Sudamericana	1963	Novela experimental	Una novela que invita a explorar distintos recorridos de lectura.	3	3	2026-10-23 10:55:56.672312-05
10	Bestiario	Julio Cortázar	PENDIENTE-010	Editorial Sudamericana	1951	Cuentos	Relatos donde lo cotidiano se transforma en algo extraño.	1	1	2026-10-23 10:55:56.672312-05
11	Final del juego	Julio Cortázar	PENDIENTE-011	Editorial Los Presentes	1956	Cuentos	Colección de relatos de imaginación y extrañeza.	2	2	2026-10-23 10:55:56.672312-05
12	Las armas secretas	Julio Cortázar	PENDIENTE-012	Editorial Sudamericana	1959	Cuentos	Cinco relatos que exploran la identidad y lo fantástico.	1	1	2026-10-23 10:55:56.672312-05
13	Todos los fuegos el fuego	Julio Cortázar	PENDIENTE-013	Editorial Sudamericana	1966	Cuentos	Ocho relatos de situaciones extraordinarias.	2	2	2026-10-23 10:55:56.672312-05
14	Historias de cronopios y de famas	Julio Cortázar	PENDIENTE-014	Editorial Minotauro	1962	Narrativa breve	Textos breves llenos de humor e imaginación.	2	2	2026-10-23 10:55:56.672312-05
16	Brida	Paulo Coelho	PENDIENTE-016	Editorial Rocco	1990	Ficción filosófica	Una joven explora su camino espiritual.	1	1	2026-10-23 10:55:56.672312-05
17	Veronika decide morir	Paulo Coelho	PENDIENTE-017	Editorial Rocco	1998	Novela	Una joven replantea su vida tras una crisis personal.	2	2	2026-10-23 10:55:56.672312-05
18	Once minutos	Paulo Coelho	PENDIENTE-018	Editorial Planeta	2003	Novela	Una mujer reflexiona sobre el amor y el autoconocimiento.	2	2	2026-10-23 10:55:56.672312-05
19	El peregrino de Compostela	Paulo Coelho	PENDIENTE-019	Editorial Rocco	1987	Viajes y espiritualidad	Un viaje de aprendizaje por el Camino de Santiago.	1	1	2026-10-23 10:55:56.672312-05
20	Ficciones	Jorge Luis Borges	PENDIENTE-020	Editorial Sur	1944	Cuentos	Relatos sobre laberintos, bibliotecas y mundos imaginarios.	2	2	2026-10-23 10:55:56.672312-05
21	El Aleph	Jorge Luis Borges	PENDIENTE-021	Editorial Losada	1949	Cuentos	Relatos que exploran el infinito y la realidad.	2	2	2026-10-23 10:55:56.672312-05
22	El libro de arena	Jorge Luis Borges	PENDIENTE-022	Editorial Emecé	1975	Cuentos	Historias fantásticas sobre el tiempo y lo imposible.	1	1	2026-10-23 10:55:56.672312-05
23	Historia universal de la infamia	Jorge Luis Borges	PENDIENTE-023	Editorial Tor	1935	Narrativa breve	Relatos inspirados en personajes y episodios históricos.	1	1	2026-10-23 10:55:56.672312-05
24	El hacedor	Jorge Luis Borges	PENDIENTE-024	Editorial Emecé	1960	Ensayo y poesía	Textos breves que combinan poesía, reflexión y ficción.	1	1	2026-10-23 10:55:56.672312-05
25	La casa de los espíritus	Isabel Allende	PENDIENTE-025	Plaza & Janés	1982	Realismo mágico	Historia familiar atravesada por la memoria y la política.	3	3	2026-10-23 10:55:56.672312-05
26	Eva Luna	Isabel Allende	PENDIENTE-026	Plaza & Janés	1987	Novela	La vida de una narradora de historias en Latinoamérica.	2	2	2026-10-23 10:55:56.672312-05
27	Paula	Isabel Allende	PENDIENTE-027	Plaza & Janés	1994	Memorias	Relato íntimo sobre la familia, la memoria y la pérdida.	1	1	2026-10-23 10:55:56.672312-05
28	De amor y de sombra	Isabel Allende	PENDIENTE-028	Plaza & Janés	1984	Romance	Una historia de amor en medio de la represión política.	2	2	2026-10-23 10:55:56.672312-05
29	Inés del alma mía	Isabel Allende	PENDIENTE-029	HarperCollins	2006	Novela histórica	Novela inspirada en la vida de Inés Suárez.	1	1	2026-10-23 10:55:56.672312-05
30	La ciudad y los perros	Mario Vargas Llosa	PENDIENTE-030	Editorial Seix Barral	1963	Novela	Conflictos y jerarquías en un colegio militar.	2	2	2026-10-23 10:55:56.672312-05
31	La casa verde	Mario Vargas Llosa	PENDIENTE-031	Editorial Seix Barral	1966	Novela	Historias entrelazadas en distintos espacios del Perú.	1	1	2026-10-23 10:55:56.672312-05
32	Conversación en La Catedral	Mario Vargas Llosa	PENDIENTE-032	Editorial Seix Barral	1969	Novela	Una conversación reconstruye una época de corrupción política.	1	1	2026-10-23 10:55:56.672312-05
33	Pantaleón y las visitadoras	Mario Vargas Llosa	PENDIENTE-033	Editorial Seix Barral	1973	Sátira	Una misión militar se convierte en una situación absurda.	2	2	2026-10-23 10:55:56.672312-05
35	Pedro Páramo	Juan Rulfo	PENDIENTE-035	Fondo de Cultura Económica	1955	Novela	Un hombre llega a Comala buscando a su padre.	3	3	2026-10-23 10:55:56.672312-05
36	El llano en llamas	Juan Rulfo	PENDIENTE-036	Fondo de Cultura Económica	1953	Cuentos	Relatos sobre la vida rural mexicana.	2	2	2026-10-23 10:55:56.672312-05
37	El gallo de oro	Juan Rulfo	PENDIENTE-037	Editorial Era	1980	Novela corta	Una historia de azar, ambición y espectáculos populares.	1	1	2026-10-23 10:55:56.672312-05
38	El túnel	Ernesto Sábato	PENDIENTE-038	Editorial Sur	1948	Novela psicológica	Un pintor relata los hechos que lo llevaron al crimen.	2	2	2026-10-23 10:55:56.672312-05
39	Sobre héroes y tumbas	Ernesto Sábato	PENDIENTE-039	Compañía General Fabril Editora	1961	Novela	Una historia de amor, crisis y obsesiones en Argentina.	1	1	2026-10-23 10:55:56.672312-05
40	Abaddón el exterminador	Ernesto Sábato	PENDIENTE-040	Editorial Seix Barral	1974	Novela	Una exploración literaria de la crisis y la condición humana.	1	1	2026-10-23 10:55:56.672312-05
42	Gracias por el fuego	Mario Benedetti	PENDIENTE-042	Editorial Alfa	1965	Novela	Conflictos familiares y políticos en la sociedad uruguaya.	1	1	2026-10-23 10:55:56.672312-05
43	Veinte poemas de amor y una canción desesperada	Pablo Neruda	PENDIENTE-043	Editorial Nascimento	1924	Poesía	Poemario sobre el amor, el deseo y la ausencia.	2	2	2026-10-23 10:55:56.672312-05
44	El señor presidente	Miguel Ángel Asturias	PENDIENTE-044	Costa-Amic Editores	1946	Novela política	Una denuncia literaria del autoritarismo.	1	1	2026-10-23 10:55:56.672312-05
45	Los pasos perdidos	Alejo Carpentier	PENDIENTE-045	Editorial Losada	1953	Novela	Un viaje por la selva lleva a reflexionar sobre la civilización.	1	1	2026-10-23 10:55:56.672312-05
47	El beso de la mujer araña	Manuel Puig	PENDIENTE-047	Editorial Seix Barral	1976	Novela	Dos presos construyen una relación mediante relatos y conversaciones.	1	1	2026-10-23 10:55:56.672312-05
48	Como agua para chocolate	Laura Esquivel	PENDIENTE-048	Editorial Planeta	1989	Realismo mágico	La cocina y las emociones se entrelazan en una historia familiar.	2	2	2026-10-23 10:55:56.672312-05
49	La ciudad de las bestias	Isabel Allende	PENDIENTE-049	Editorial Sudamericana	2002	Aventura juvenil	Una expedición lleva a un joven a la selva amazónica.	2	2	2026-10-23 10:55:56.672312-05
41	La tregua	Mario Benedetti	PENDIENTE-041	Editorial Alfa	1960	Romance	El diario de un hombre que descubre una nueva oportunidad de amar.	2	1	2026-10-23 10:55:56.672312-05
46	La invención de Morel	Adolfo Bioy Casares	PENDIENTE-046	Editorial Losada	1940	Ciencia ficción	Un fugitivo descubre una máquina que desafía la realidad.	2	2	2026-10-23 10:55:56.672312-05
\.


--
-- TOC entry 4987 (class 0 OID 16408)
-- Dependencies: 220
-- Data for Name: pqrs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pqrs (id, nombre, correo, tipo, mensaje, estado, respuesta, creado_en, respondido_en, apellido) FROM stdin;
1	Juan José	juanjose.sepu50@gmail.com	peticion	aaaaaaaaaaa	en_revision	\N	2026-10-23 11:11:16.694011-05	\N	Sepúlveda Álvarez
\.


--
-- TOC entry 4991 (class 0 OID 16439)
-- Dependencies: 224
-- Data for Name: prestamos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prestamos (id, usuario_id, libro_id, fecha_prestamo, fecha_vencimiento, fecha_devolucion, estado, observaciones, creado_en) FROM stdin;
1	3	34	2026-10-24	2026-11-07	\N	prestado	\N	2026-10-24 23:04:15.941283-05
2	3	41	2026-10-24	2026-11-07	\N	prestado	\N	2026-10-24 23:04:42.781317-05
3	3	46	2026-10-24	2026-11-07	2026-10-24	devuelto	\N	2026-10-24 23:04:53.836982-05
\.


--
-- TOC entry 4995 (class 0 OID 16504)
-- Dependencies: 228
-- Data for Name: sanciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sanciones (id, usuario_id, prestamo_id, dias_sancion, motivo, fecha_inicio, fecha_fin, estado, creado_en) FROM stdin;
\.


--
-- TOC entry 4993 (class 0 OID 16466)
-- Dependencies: 226
-- Data for Name: solicitudes_prestamo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.solicitudes_prestamo (id, usuario_id, libro_id, estado, fecha_solicitud, fecha_respuesta, respondido_por, observaciones, prestamo_id) FROM stdin;
3	3	34	aprobado	2026-10-24 23:03:48.297444-05	2026-10-24 23:04:15.941283-05	1	\N	1
2	3	41	aprobado	2026-10-24 23:03:37.712577-05	2026-10-24 23:04:42.781317-05	1	\N	2
1	3	46	aprobado	2026-10-24 22:56:39.027975-05	2026-10-24 23:04:53.836982-05	1	\N	3
4	3	51	rechazado	2026-10-24 23:07:34.86697-05	2026-10-24 23:07:48.757576-05	1	\N	\N
\.


--
-- TOC entry 4985 (class 0 OID 16390)
-- Dependencies: 218
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, nombre, apellido, celular, correo, clave_hash, sexo, rol, creado_en) FROM stdin;
3	Sebastián	Sierra	3136796613	juanjose.sepu500@gmail.com	$2b$12$i/aFdfOpRYSODOq2pr/1k.dc8S1uzR1itrey/UglCKXHLC59vv9Li	masculino	usuario	2026-10-22 16:16:08.964759-05
1	Juan José	Sepúlveda Álvarez	3136796612	juanjose.sepu50@gmail.com	$2b$12$.oYXb8fDWYq.3xLXMF3W.uJZDg24dIxsH.dh3OcOJQaBtWAd9KdyW	masculino	administrador	2026-10-21 14:13:32.078046-05
\.


--
-- TOC entry 5007 (class 0 OID 0)
-- Dependencies: 221
-- Name: libros_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.libros_id_seq', 51, true);


--
-- TOC entry 5008 (class 0 OID 0)
-- Dependencies: 219
-- Name: pqrs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pqrs_id_seq', 1, true);


--
-- TOC entry 5009 (class 0 OID 0)
-- Dependencies: 223
-- Name: prestamos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.prestamos_id_seq', 3, true);


--
-- TOC entry 5010 (class 0 OID 0)
-- Dependencies: 227
-- Name: sanciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sanciones_id_seq', 1, false);


--
-- TOC entry 5011 (class 0 OID 0)
-- Dependencies: 225
-- Name: solicitudes_prestamo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.solicitudes_prestamo_id_seq', 4, true);


--
-- TOC entry 5012 (class 0 OID 0)
-- Dependencies: 217
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 4, true);


--
-- TOC entry 4812 (class 2606 OID 16437)
-- Name: libros libros_isbn_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.libros
    ADD CONSTRAINT libros_isbn_key UNIQUE (isbn);


--
-- TOC entry 4814 (class 2606 OID 16435)
-- Name: libros libros_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.libros
    ADD CONSTRAINT libros_pkey PRIMARY KEY (id);


--
-- TOC entry 4810 (class 2606 OID 16420)
-- Name: pqrs pqrs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pqrs
    ADD CONSTRAINT pqrs_pkey PRIMARY KEY (id);


--
-- TOC entry 4819 (class 2606 OID 16451)
-- Name: prestamos prestamos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prestamos
    ADD CONSTRAINT prestamos_pkey PRIMARY KEY (id);


--
-- TOC entry 4829 (class 2606 OID 16517)
-- Name: sanciones sanciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sanciones
    ADD CONSTRAINT sanciones_pkey PRIMARY KEY (id);


--
-- TOC entry 4823 (class 2606 OID 16477)
-- Name: solicitudes_prestamo solicitudes_prestamo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_prestamo
    ADD CONSTRAINT solicitudes_prestamo_pkey PRIMARY KEY (id);


--
-- TOC entry 4825 (class 2606 OID 16479)
-- Name: solicitudes_prestamo solicitudes_prestamo_prestamo_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_prestamo
    ADD CONSTRAINT solicitudes_prestamo_prestamo_id_key UNIQUE (prestamo_id);


--
-- TOC entry 4806 (class 2606 OID 16406)
-- Name: usuarios usuarios_correo_uq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_correo_uq UNIQUE (correo);


--
-- TOC entry 4808 (class 2606 OID 16404)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 4815 (class 1259 OID 16464)
-- Name: idx_prestamos_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prestamos_estado ON public.prestamos USING btree (estado);


--
-- TOC entry 4816 (class 1259 OID 16463)
-- Name: idx_prestamos_libro; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prestamos_libro ON public.prestamos USING btree (libro_id);


--
-- TOC entry 4817 (class 1259 OID 16462)
-- Name: idx_prestamos_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prestamos_usuario ON public.prestamos USING btree (usuario_id);


--
-- TOC entry 4827 (class 1259 OID 16529)
-- Name: sanciones_estado_fecha_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sanciones_estado_fecha_idx ON public.sanciones USING btree (estado, fecha_fin);


--
-- TOC entry 4830 (class 1259 OID 16528)
-- Name: sanciones_usuario_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sanciones_usuario_idx ON public.sanciones USING btree (usuario_id);


--
-- TOC entry 4820 (class 1259 OID 16500)
-- Name: solicitudes_estado_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX solicitudes_estado_idx ON public.solicitudes_prestamo USING btree (estado);


--
-- TOC entry 4821 (class 1259 OID 16502)
-- Name: solicitudes_libro_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX solicitudes_libro_idx ON public.solicitudes_prestamo USING btree (libro_id);


--
-- TOC entry 4826 (class 1259 OID 16501)
-- Name: solicitudes_usuario_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX solicitudes_usuario_idx ON public.solicitudes_prestamo USING btree (usuario_id);


--
-- TOC entry 4831 (class 2606 OID 16457)
-- Name: prestamos prestamos_libro_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prestamos
    ADD CONSTRAINT prestamos_libro_fk FOREIGN KEY (libro_id) REFERENCES public.libros(id) ON DELETE RESTRICT;


--
-- TOC entry 4832 (class 2606 OID 16452)
-- Name: prestamos prestamos_usuario_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prestamos
    ADD CONSTRAINT prestamos_usuario_fk FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE RESTRICT;


--
-- TOC entry 4837 (class 2606 OID 16523)
-- Name: sanciones sanciones_prestamo_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sanciones
    ADD CONSTRAINT sanciones_prestamo_fk FOREIGN KEY (prestamo_id) REFERENCES public.prestamos(id) ON DELETE RESTRICT;


--
-- TOC entry 4838 (class 2606 OID 16518)
-- Name: sanciones sanciones_usuario_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sanciones
    ADD CONSTRAINT sanciones_usuario_fk FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE RESTRICT;


--
-- TOC entry 4833 (class 2606 OID 16485)
-- Name: solicitudes_prestamo solicitudes_libro_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_prestamo
    ADD CONSTRAINT solicitudes_libro_fk FOREIGN KEY (libro_id) REFERENCES public.libros(id) ON DELETE RESTRICT;


--
-- TOC entry 4834 (class 2606 OID 16495)
-- Name: solicitudes_prestamo solicitudes_prestamo_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_prestamo
    ADD CONSTRAINT solicitudes_prestamo_fk FOREIGN KEY (prestamo_id) REFERENCES public.prestamos(id) ON DELETE RESTRICT;


--
-- TOC entry 4835 (class 2606 OID 16490)
-- Name: solicitudes_prestamo solicitudes_responsable_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_prestamo
    ADD CONSTRAINT solicitudes_responsable_fk FOREIGN KEY (respondido_por) REFERENCES public.usuarios(id) ON DELETE RESTRICT;


--
-- TOC entry 4836 (class 2606 OID 16480)
-- Name: solicitudes_prestamo solicitudes_usuario_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_prestamo
    ADD CONSTRAINT solicitudes_usuario_fk FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE RESTRICT;


-- Completed on 2026-10-24 23:11:51

--
-- PostgreSQL database dump complete
--

\unrestrict fRkUKXDxVJfCFQKyJEcDBoGZvEX6cpfHDWgEdZXyJpntMDJf5o4MZxAIHQqycSz

