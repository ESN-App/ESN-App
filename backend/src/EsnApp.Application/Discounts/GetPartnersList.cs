using EsnApp.Application.Common;
using MediatR;

namespace EsnApp.Application.Discounts;

public record GetPartnersListQuery : IRequest<Result<IReadOnlyList<PartnerDto>>>;

public class GetPartnersListQueryHandler(IPartnerRepository repository)
    : IRequestHandler<GetPartnersListQuery, Result<IReadOnlyList<PartnerDto>>>
{
    public async Task<Result<IReadOnlyList<PartnerDto>>> Handle(
        GetPartnersListQuery request,
        CancellationToken cancellationToken)
    {
        var partners = await repository.GetAllAsync(cancellationToken);

        return Result.Success<IReadOnlyList<PartnerDto>>(
            partners.Select(PartnerDto.FromEntity).ToList());
    }
}
