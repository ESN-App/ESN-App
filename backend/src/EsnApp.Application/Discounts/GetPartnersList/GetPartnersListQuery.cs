using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Common;
using MediatR;

namespace EsnApp.Application.Discounts.GetPartnersList;

public record GetPartnersListQuery : IRequest<Result<IReadOnlyList<PartnerDto>>>;
