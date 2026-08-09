using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EsnApp.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveEventCoordinates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "Events");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
    }
}
