using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Abstractions;
using EsnApp.Application.Discounts.Common;
using MediatR;

namespace EsnApp.Application.Discounts.GetAdminPartnerBySlug;

public class GetAdminPartnerBySlugQueryHandler(IPartnerRepository repository)
    : IRequestHandler<GetAdminPartnerBySlugQuery, Result<AdminPartnerDto>>
{
    public async Task<Result<AdminPartnerDto>> Handle(
        GetAdminPartnerBySlugQuery request,
        CancellationToken cancellationToken)
    {
        var entity = await repository.GetAdminBySlugAsync(request.Slug, cancellationToken);

        return entity is null
            ? Result.Failure<AdminPartnerDto>($"Partner '{request.Slug}' was not found.")
            : Result.Success(entity.ToAdminDto());
    }
}
