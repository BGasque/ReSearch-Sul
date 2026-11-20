-- CreateTable
CREATE TABLE "InteresseTipo" (
    "usuarioId" INTEGER NOT NULL,
    "tipo" "TipoConteudo" NOT NULL,

    CONSTRAINT "InteresseTipo_pkey" PRIMARY KEY ("usuarioId","tipo")
);

-- AddForeignKey
ALTER TABLE "InteresseTipo" ADD CONSTRAINT "InteresseTipo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
