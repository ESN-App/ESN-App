using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EsnApp.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RenameInfoArticleImageUrlToImagePath : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ImageUrl",
                table: "InfoArticles",
                newName: "ImagePath");

            // Info images are now served from wwwroot like partner logos, so repoint the
            // seeded articles from their remote Unsplash URLs to the committed local assets.
            migrationBuilder.Sql(
                """
                UPDATE "InfoArticles"
                SET "ImagePath" = '/api/images/info/' || "Slug" || '.jpg'
                WHERE "ImagePath" LIKE 'https://images.unsplash.com/%';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ImagePath",
                table: "InfoArticles",
                newName: "ImageUrl");
        }
    }
}
