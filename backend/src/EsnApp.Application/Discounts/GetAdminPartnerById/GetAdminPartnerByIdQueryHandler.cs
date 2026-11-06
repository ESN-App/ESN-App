using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Abstractions;
using EsnApp.Application.Discounts.Common;
using MediatR;

namespace EsnApp.Application.Discounts.GetAdminPartnerById;

public class GetAdminPartnerByIdQueryHandler(IPartnerRepository repository)
    : IRequestHandler<GetAdminPartnerByIdQuery, Result<AdminPartnerDto>>
{
    public async Task<Result<AdminPartnerDto>> Handle(
        GetAdminPartnerByIdQuery request,
        CancellationToken cancellationToken)
    {
        var entity = await repository.GetAdminByIdAsync(request.Id, cancellationToken);

        return entity is null
            ? Result.Failure<AdminPartnerDto>($"Partner '{request.Id}' was not found.")
            : Result.Success(entity.ToAdminDto());
    }
}
