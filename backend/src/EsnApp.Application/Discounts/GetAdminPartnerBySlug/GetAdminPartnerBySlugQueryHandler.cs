using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Abstractions;
using EsnApp.Application.Discounts.Common;
using MediatR;

namespace EsnApp.Application.Discounts.GetAdminPartnerBySlug;

public class GetAdminPartnerBySlugQueryHandler(IPartnerRepository repository)
    : IRequestHandler<GetAdminPartnerBySlugQuery, Result<PartnerDto>>
{
    public async Task<Result<PartnerDto>> Handle(
        GetAdminPartnerBySlugQuery request,
        CancellationToken cancellationToken)
    {
        var entity = await repository.GetAdminBySlugAsync(request.Slug, cancellationToken);

        return entity is null
            ? Result.Failure<PartnerDto>($"Partner '{request.Slug}' was not found.")
            : Result.Success(entity.ToDto());
    }
}
