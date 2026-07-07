using EsnApp.Domain.Discounts;

namespace EsnApp.Application.Discounts;

public interface IDiscountRepository
{
    Task<IReadOnlyList<Discount>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<Discount?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Discount> AddAsync(Discount entity, CancellationToken cancellationToken = default);
}
