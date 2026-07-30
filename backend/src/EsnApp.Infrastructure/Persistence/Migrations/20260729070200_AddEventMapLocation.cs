using EsnApp.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EsnApp.Infrastructure.Persistence.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260729070200_AddEventMapLocation")]
public partial class AddEventMapLocation : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "GoogleMapsUrl",
            table: "Events",
            type: "character varying(2000)",
            maxLength: 2000,
            nullable: true);

        migrationBuilder.AddColumn<decimal>(
            name: "Latitude",
            table: "Events",
            type: "numeric(9,6)",
            precision: 9,
            scale: 6,
            nullable: true);

        migrationBuilder.AddColumn<decimal>(
            name: "Longitude",
            table: "Events",
            type: "numeric(9,6)",
            precision: 9,
            scale: 6,
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "GoogleMapsUrl", table: "Events");
        migrationBuilder.DropColumn(name: "Latitude", table: "Events");
        migrationBuilder.DropColumn(name: "Longitude", table: "Events");
    }
}
