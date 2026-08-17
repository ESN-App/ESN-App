using EsnApp.Domain.Info;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EsnApp.Infrastructure.Persistence.Configurations;

public class InfoArticleConfiguration : IEntityTypeConfiguration<InfoArticle>
{
    public void Configure(EntityTypeBuilder<InfoArticle> builder)
    {
        builder.Property(article => article.Title).IsRequired().HasMaxLength(200);
        builder.Property(article => article.Slug).IsRequired().HasMaxLength(200);
        builder.Property(article => article.Content).IsRequired();
        builder.Property(article => article.Category).IsRequired().HasMaxLength(100);
        builder.Property(article => article.ImagePath)
            .IsRequired()
            .HasMaxLength(2000);
        builder.Property(article => article.ExternalLinks).IsRequired();
        builder.Property(article => article.Status).IsRequired();
        builder.Property(article => article.DisplayOrder).IsRequired();

        builder.HasIndex(article => article.Slug).IsUnique();
        builder.HasIndex(article => new
        {
            article.Status,
            article.Category,
            article.DisplayOrder,
        });
    }
}
