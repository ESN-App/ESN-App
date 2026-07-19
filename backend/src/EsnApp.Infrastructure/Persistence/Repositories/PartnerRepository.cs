using EsnApp.Application.Discounts;
using EsnApp.Domain.Discounts;

namespace EsnApp.Infrastructure.Persistence.Repositories;

public class PartnerRepository(AppDbContext context)
    : RepositoryBase<Partner>(context), IPartnerRepository
{
}
