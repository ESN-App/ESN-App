using EsnApp.Domain.Discounts;

namespace EsnApp.Application.Discounts.Abstractions;

public interface IPartnerRepository
{
    Task<IReadOnlyList<Partner>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<Partner?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Partner>> GetAdminListAsync(
        PartnerStatus? status,
        CancellationToken cancellationToken = default);

    Task<Partner?> GetAdminByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Partner> AddAsync(Partner entity, CancellationToken cancellationToken = default);

    Task<Partner> UpdateAsync(Partner entity, CancellationToken cancellationToken = default);

    Task UpdateRangeAsync(
        IReadOnlyCollection<Partner> partners,
        CancellationToken cancellationToken = default);
}
