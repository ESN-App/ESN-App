using EsnApp.Application.News.Abstractions;
using EsnApp.Domain.News;
using Microsoft.EntityFrameworkCore;

namespace EsnApp.Infrastructure.Persistence.Repositories;

public class NewsItemRepository(AppDbContext context)
    : RepositoryBase<NewsItem>(context), INewsItemRepository
{
    public async Task<IReadOnlyList<NewsItem>> GetPublishedAsync(
        CancellationToken cancellationToken = default) =>
        await Context.NewsItems
            .AsNoTracking()
            .Where(item => item.Status == NewsItemStatus.Published)
            .OrderBy(item => item.DisplayOrder)
            .ThenByDescending(item => item.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<NewsItem?> GetPublishedByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default) =>
        await Context.NewsItems
            .AsNoTracking()
            .FirstOrDefaultAsync(
                item => item.Id == id && item.Status == NewsItemStatus.Published,
                cancellationToken);

    public async Task<IReadOnlyList<NewsItem>> GetAdminListAsync(
        NewsItemStatus? status,
        CancellationToken cancellationToken = default)
    {
        var query = Context.NewsItems.AsNoTracking();

        if (status.HasValue)
            query = query.Where(item => item.Status == status);

        return await query
            .OrderBy(item => item.Status)
            .ThenBy(item => item.DisplayOrder)
            .ThenByDescending(item => item.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<NewsItem?> GetAdminByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default) =>
        await Context.NewsItems.FirstOrDefaultAsync(
            item => item.Id == id,
            cancellationToken);

    public async Task UpdateRangeAsync(
        IReadOnlyCollection<NewsItem> entities,
        CancellationToken cancellationToken = default)
    {
        Context.NewsItems.UpdateRange(entities);
        await Context.SaveChangesAsync(cancellationToken);
    }
}
