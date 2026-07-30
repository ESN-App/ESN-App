using EsnApp.Domain.News;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EsnApp.Infrastructure.Persistence.Configurations;

public class NewsItemConfiguration : IEntityTypeConfiguration<NewsItem>
{
    public void Configure(EntityTypeBuilder<NewsItem> builder)
    {
        builder.Property(item => item.Title).IsRequired().HasMaxLength(200);
        builder.Property(item => item.Description).IsRequired().HasMaxLength(2000);
        builder.Property(item => item.ImagePath).IsRequired().HasMaxLength(2000);
        builder.Property(item => item.DisplayOrder).IsRequired();
        builder.Property(item => item.Status).IsRequired();

        builder.HasIndex(item => new
        {
            item.Status,
            item.DisplayOrder,
        });
    }
}
