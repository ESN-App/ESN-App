using EsnApp.Domain.Discounts;

namespace EsnApp.Application.Discounts;

public interface IPartnerRepository
{
    Task<IReadOnlyList<Partner>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<Partner?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Partner> AddAsync(Partner entity, CancellationToken cancellationToken = default);
}
