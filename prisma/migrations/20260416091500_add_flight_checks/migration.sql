-- CreateTable
CREATE TABLE "FlightCheck" (
    "id" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlightCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlightCheckParticipant" (
    "id" TEXT NOT NULL,
    "flightCheckId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "participated" BOOLEAN NOT NULL DEFAULT false,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlightCheckParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FlightCheckParticipant_flightCheckId_memberId_key" ON "FlightCheckParticipant"("flightCheckId", "memberId");

-- AddForeignKey
ALTER TABLE "FlightCheckParticipant" ADD CONSTRAINT "FlightCheckParticipant_flightCheckId_fkey" FOREIGN KEY ("flightCheckId") REFERENCES "FlightCheck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightCheckParticipant" ADD CONSTRAINT "FlightCheckParticipant_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
