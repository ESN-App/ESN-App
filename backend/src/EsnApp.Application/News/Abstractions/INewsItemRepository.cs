using EsnApp.Domain.News;

namespace EsnApp.Application.News.Abstractions;

public interface INewsItemRepository
{
    Task<IReadOnlyList<NewsItem>> GetPublishedAsync(
        CancellationToken cancellationToken = default);

    Task<NewsItem?> GetPublishedByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<NewsItem>> GetAdminListAsync(
        NewsItemStatus? status,
        CancellationToken cancellationToken = default);

    Task<NewsItem?> GetAdminByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<NewsItem> AddAsync(
        NewsItem entity,
        CancellationToken cancellationToken = default);

    Task<NewsItem> UpdateAsync(
        NewsItem entity,
        CancellationToken cancellationToken = default);

    Task UpdateRangeAsync(
        IReadOnlyCollection<NewsItem> entities,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(
        Guid id,
        CancellationToken cancellationToken = default);
}
